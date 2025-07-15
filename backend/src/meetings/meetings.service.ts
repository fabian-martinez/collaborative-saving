import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { SimplifiedRecordTransactionsDto } from './dto/simplified-record-transactions.dto';
import { Operation } from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '../common/constants/account-types';
import { Meeting } from './entities/meeting.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Member } from '../members/entities/member.entity';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { MemberDue } from '../dues/entities/member-due.entity';
import { BuyStockForMemberDto } from '../stocks/dto/buy-stock-for-member.dto';
import { StocksService } from '../stocks/stocks.service';
import { LoansService } from '../loans/loans.service';
import { PendingMemberPayment } from './entities/pending-member-payment.entity';
import {
  DisbursementPlanPreviewResponseDto,
  ExecuteDisbursementPlanDto,
  DisbursementPlanItemDto,
  DisbursementType,
} from './dto/disbursement-plan.dto';
import { WithdrawStockForMemberDto } from './dto/withdraw-stock-for-member.dto';
import { DisbursementStrategyFactory } from './strategies/disbursement-strategy.factory';
import { LoanTransactionDetail } from '../loans/entities/loan-transaction-detail.entity';
import { NewLoanRequestDto } from './dto/disbursement-plan.dto';
import { OperationType } from '../common/enums/operation-type.enum';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    private readonly dataSource: DataSource,
    private readonly paymentStrategyFactory: PaymentStrategyFactory,
    private readonly stocksService: StocksService,
    @Inject(forwardRef(() => LoansService))
    private readonly loansService: LoansService,
    private readonly disbursementStrategyFactory: DisbursementStrategyFactory,
  ) {}

  findAll(): Promise<Meeting[]> {
    return this.meetingRepository.find({
      order: {
        date: 'DESC',
      },
    });
  }

  async findActive(): Promise<Meeting | null> {
    return this.meetingRepository.findOne({
      where: { status: 'active' },
    });
  }

  async findMonthlyPaymentsByMeeting(meetingId: string): Promise<Operation[]> {
    return this.dataSource.manager.getRepository(Operation).find({
      where: {
        meeting_id: meetingId,
        type: OperationType.MONTHLY_PAYMENT,
      },
      relations: ['member', 'ledger_entries'],
    });
  }

  async recordMonthlyPayment(
    recordTransactionsDto: SimplifiedRecordTransactionsDto,
  ): Promise<any> {
    const { memberId, payments } = recordTransactionsDto;

    const activeMeeting = await this.meetingRepository.findOne({
      where: { status: 'active' },
    });

    if (!activeMeeting) {
      throw new NotFoundException('No active meeting found.');
    }

    const existingPayment = await this.dataSource.manager
      .getRepository(Operation)
      .findOne({
        where: {
          member_id: memberId,
          meeting_id: activeMeeting.id,
          type: OperationType.MONTHLY_PAYMENT,
        },
      });

    if (existingPayment) {
      throw new BadRequestException(
        'El socio ya ha realizado su pago mensual en esta reunión.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const operation = await this._createOperationForMember(
        queryRunner,
        activeMeeting.id,
        memberId,
        OperationType.MONTHLY_PAYMENT,
      );

      const ledgerEntries: LedgerEntry[] = [];
      for (const payment of payments) {
        const entries = await this._processPayment(
          queryRunner,
          operation,
          payment,
        );
        ledgerEntries.push(...entries);
      }
      await queryRunner.manager.save(ledgerEntries);

      // Obtener los detalles de pagos de préstamos realizados en esta operación
      const loanDetails: LoanTransactionDetail[] =
        await queryRunner.manager.find(LoanTransactionDetail, {
          where: { operation_id: operation.id },
        });

      await queryRunner.commitTransaction();
      return {
        operation,
        loanPayments: loanDetails.map((d) => ({
          loanId: d.loan_id,
          transactionType: d.transaction_type,
          amount: d.amount,
        })),
      };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error recording transaction', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async _createOperationForMember(
    queryRunner: QueryRunner,
    meetingId: string,
    memberId: string,
    type: OperationType,
  ): Promise<Operation> {
    const member = await this.dataSource.manager.findOne(Member, {
      where: { id: memberId },
    });
    const meeting = await this.dataSource.manager.findOne(Meeting, {
      where: { id: meetingId },
    });
    const operation = queryRunner.manager.create(Operation, {
      meeting_id: meetingId,
      member_id: memberId,
      description: `Registro de transacciones para el socio ${member?.name} en la reunión ${meeting?.date.toLocaleDateString()}.`,
      type,
    });
    await queryRunner.manager.save(operation);
    return operation;
  }

  private async _processPayment(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): Promise<LedgerEntry[]> {
    const ledgerEntries: LedgerEntry[] = [];
    const isNovelty = payment.type === 'novelty';
    const ledgerAmount = isNovelty ? -Math.abs(payment.amount) : payment.amount;
    ledgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: CASH_ACCOUNT,
        amount: ledgerAmount,
        description: payment.description,
      }),
    );

    const strategy = this.paymentStrategyFactory.getStrategy(payment.type);
    const strategyEntries = await strategy.process(
      queryRunner,
      operation,
      payment,
    );
    ledgerEntries.push(...strategyEntries);

    return ledgerEntries;
  }

  async create(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    const activeMeeting = await this.meetingRepository.findOne({
      where: { status: 'active' },
    });

    if (activeMeeting) {
      throw new BadRequestException(
        'An active meeting already exists. Please close it before creating a new one.',
      );
    }

    const meeting = this.meetingRepository.create(createMeetingDto);
    return this.meetingRepository.save(meeting);
  }

  async close(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOneBy({ id });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found.`);
    }

    if (meeting.status === 'closed') {
      throw new BadRequestException('This meeting is already closed.');
    }

    meeting.status = 'closed';
    return this.meetingRepository.save(meeting);
  }

  async buyStocksForMember(meetingId: string, dto: BuyStockForMemberDto) {
    // 1. Validar que la reunión existe y está activa
    const meeting = await this.meetingRepository.findOneBy({ id: meetingId });
    if (!meeting || meeting.status !== 'active') {
      throw new BadRequestException('La reunión no existe o no está activa.');
    }
    return this.stocksService.purchaseForMember(meetingId, dto);
  }

  async withdrawStocksForMember(
    meetingId: string,
    dto: WithdrawStockForMemberDto,
  ) {
    // Validar que la reunión existe y está activa
    const meeting = await this.meetingRepository.findOneBy({ id: meetingId });
    if (!meeting || meeting.status !== 'active') {
      throw new BadRequestException('La reunión no existe o no está activa.');
    }
    // Validar que el socio tiene suscripción suficiente
    const subscriptions =
      await this.stocksService.getStockSubscriptionByMemberAndStock({
        stockId: dto.stockId,
        memberId: dto.memberId,
      });
    // Filtrar solo suscripciones sin crédito asociado
    const withdrawableSubscriptions = subscriptions.filter(
      (sub) => sub.financing_loan_id === null,
    );
    const totalWithdrawable = withdrawableSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.quantity),
      0,
    );
    if (totalWithdrawable < dto.quantity) {
      throw new BadRequestException(
        'Solo puede retirar acciones que no tengan un crédito asociado. La cantidad solicitada excede las acciones libres de crédito.',
      );
    }
    // Obtener el valor actual de la acción
    const stock = await this.stocksService.findOne(dto.stockId);
    const amount = Number(stock.value) * dto.quantity;
    // Crear registro en pending_member_payments
    const pendingPayment = this.dataSource.manager.create(
      PendingMemberPayment,
      {
        member_id: dto.memberId,
        meeting_id: meetingId,
        type: 'stock_withdrawal',
        amount,
        status: 'pending',
        notes: dto.notes,
        stock_subscription_id: withdrawableSubscriptions[0].id,
      },
    );
    await this.dataSource.manager.save(pendingPayment);
    return {
      message: 'Solicitud de retiro registrada exitosamente.',
      pendingPaymentId: pendingPayment.id,
    };
  }

  async calculateCashInMeeting(meetingId: string): Promise<number> {
    const cashInMeeting = await this.dataSource.manager
      .getRepository(LedgerEntry)
      .find({
        where: {
          operation: {
            meeting_id: meetingId,
          },
          account_type: CASH_ACCOUNT,
        },
      })
      .then((entries) => {
        return entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
      })
      .catch((err) => {
        this.logger.error('Error calculating cash in meeting', err);
        throw err;
      });
    return cashInMeeting;
  }

  async previewDisbursementPlan(
    meetingId: string,
    newLoanRequests?: NewLoanRequestDto[],
  ): Promise<DisbursementPlanPreviewResponseDto> {
    // 1. Obtener solicitudes pendientes de la tabla pending_member_payments para la reunión
    const pendingPayments = await this.dataSource.manager
      .getRepository(PendingMemberPayment)
      .find({
        where: { status: 'pending' },
      });
    // 2. Calcular efectivo disponible
    const availableCash = await this.calculateCashInMeeting(meetingId);
    const plan: DisbursementPlanItemDto[] = pendingPayments.map((p) => {
      const disbursementStockRequest = p.stock_subscription_id
        ? {
            stockId: p.stock_subscription_id,
            stockWithdrawalQuantity: undefined,
          }
        : undefined;
      return {
        memberId: p.member_id,
        type: p.type as DisbursementPlanItemDto['type'],
        amount: Number(p.amount),
        status: p.status as DisbursementPlanItemDto['status'],
        notes: p.notes,
        stockSubscriptionId: p.stock_subscription_id || undefined,
        loanId: p.loan_id || undefined,
        disbursementStockRequest,
      };
    });
    // 3. Agregar préstamos nuevos al plan si se reciben
    if (newLoanRequests && Array.isArray(newLoanRequests)) {
      for (const req of newLoanRequests) {
        plan.push({
          memberId: req.memberId,
          type: DisbursementType.LOAN,
          amount: req.amount,
          status: 'pending',
          newLoanRequest: req,
        });
      }
    }
    const totalToDisburse = plan.reduce((sum, item) => sum + item.amount, 0);
    return { plan, availableCash, totalToDisburse };
  }

  async executeDisbursementPlan(
    meetingId: string,
    dto: ExecuteDisbursementPlanDto,
  ) {
    // 1. Validar que el plan no exceda el efectivo disponible
    console.log('dto', dto);
    const availableCash = await this.dataSource.manager
      .getRepository(LedgerEntry)
      .find({
        where: {
          operation: {
            meeting_id: meetingId,
          },
          account_type: CASH_ACCOUNT,
        },
      })
      .then((entries) => {
        return entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
      })
      .catch((err) => {
        this.logger.error('Error getting available cash', err);
        throw err;
      });
    const totalSolicitado = dto.plan.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    if (totalSolicitado > availableCash) {
      throw new BadRequestException(
        'El monto total a desembolsar excede el efectivo disponible.',
      );
    }
    // 2. Ejecutar todo en una transacción atómica
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const item of dto.plan) {
        if (item.type === DisbursementType.LOAN && item.newLoanRequest) {
          // Crear el préstamo nuevo de forma atómica
          const createLoanDto = {
            member_id: item.newLoanRequest.memberId,
            meeting_id: meetingId,
            loan_type: item.newLoanRequest.loanType,
            approved_amount: item.newLoanRequest.approvedAmount,
            disbursed_amount: item.newLoanRequest.amount,
            outstanding_balance: item.newLoanRequest.amount,
            monthly_payment_amount: item.newLoanRequest.monthlyPaymentAmount,
            interest_rate: item.newLoanRequest.interestRate,
            status: 'active',
          };
          await this.loansService.create(createLoanDto, queryRunner);
          // Aquí podrías agregar lógica adicional si necesitas registrar algo más
          continue;
        }
        // Actualizar el estado de la solicitud a 'paid' (para los demás tipos)
        await queryRunner.manager.update(
          PendingMemberPayment,
          {
            member_id: item.memberId,
            meeting_id: meetingId,
            type: item.type,
            status: 'pending',
            ...(item.stockSubscriptionId
              ? { stock_subscription_id: item.stockSubscriptionId }
              : {}),
          },
          { status: 'paid' },
        );
        // Usar el patrón Strategy para procesar el desembolso
        const strategy = this.disbursementStrategyFactory.getStrategy(
          item.type,
        );
        await strategy.execute({ queryRunner, meetingId, item });
      }
      await queryRunner.commitTransaction();
      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
