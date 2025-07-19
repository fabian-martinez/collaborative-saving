import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { SimplifiedRecordTransactionsDto } from './dto/simplified-record-transactions.dto';
import { Operation } from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  DIVIDENDS_PAYABLE_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  NOVELTY_LOSS_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '../common/constants/account-types';
import { Meeting } from './entities/meeting.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Member } from '../members/entities/member.entity';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { MemberDue } from '../dues/entities/member-due.entity';
import { BuyStockForMemberDto } from '../stocks/dto/buy-stock-for-member.dto';
import { StocksService } from '../stocks/stocks.service';
import { PendingMemberPayment } from './entities/pending-member-payment.entity';
import { PendingPaymentType } from '../common/enums/pending-payment-type.enum';
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
import { MeetingSummaryField } from './dto/meeting-summary-fields.dto';
import { validate as isUuid } from 'uuid';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    private readonly dataSource: DataSource,
    private readonly paymentStrategyFactory: PaymentStrategyFactory,
    private readonly stocksService: StocksService,
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

    // Ejecutar en una transacción para asegurar consistencia
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Marcar como 'paid' todos los pagos pendientes de esta reunión
              const pendingPayments = await queryRunner.manager
          .getRepository(PendingMemberPayment)
          .find({
            where: {
              meeting_id: id,
              status: 'pending',
            },
          });

      if (pendingPayments.length > 0) {
        this.logger.log(
          `Marcando ${pendingPayments.length} pagos pendientes como 'paid' para la reunión ${id}`,
        );

        await queryRunner.manager.update(
          PendingMemberPayment,
          {
            meeting_id: id,
            status: 'pending',
          },
          { status: 'paid' },
        );

        // Log de los pagos actualizados
        for (const payment of pendingPayments) {
          this.logger.log(
            `Pago actualizado: ${payment.type} - $${payment.amount} (ID: ${payment.id})`,
          );
        }
      }

      // 2. Cerrar la reunión
      meeting.status = 'closed';
      await queryRunner.manager.save(meeting);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Reunión ${id} cerrada exitosamente con ${pendingPayments.length} pagos actualizados`,
      );

      return meeting;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al cerrar la reunión ${id}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
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
        type: PendingPaymentType.STOCK_WITHDRAWAL,
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

      // Mapear PendingPaymentType a DisbursementType
      let disbursementType: DisbursementType;
      switch (p.type) {
        case PendingPaymentType.DIVIDEND:
          disbursementType = DisbursementType.DIVIDEND;
          break;
        case PendingPaymentType.STOCK_WITHDRAWAL:
          disbursementType = DisbursementType.WITHDRAWAL;
          break;
        case PendingPaymentType.LOAN:
          disbursementType = DisbursementType.LOAN;
          break;
        case PendingPaymentType.OTHER:
          disbursementType = DisbursementType.OTHER;
          break;
        default:
          disbursementType = DisbursementType.OTHER;
      }

      return {
        memberId: p.member_id,
        type: disbursementType,
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

  /**
   * Calcula los totales solicitados para el resumen de la reunión.
   * @param meetingId ID de la reunión
   * @param fields Campos a calcular
   */
  async getMeetingSummary(
    meetingId: string,
    fields: MeetingSummaryField[],
  ): Promise<Record<string, any>> {
    if (!meetingId || meetingId === 'undefined' || !isUuid(meetingId)) {
      throw new BadRequestException(
        'El parámetro meetingId es inválido o no está definido.',
      );
    }
    const result: { meeting?: Record<string, any>; [key: string]: any } = {};
    const repo = this.dataSource.manager.getRepository(LedgerEntry);
    // Buscar operaciones de la reunión
    const operationRepo = this.dataSource.manager.getRepository(Operation);
    const operations = await operationRepo.find({
      where: { meeting_id: meetingId },
      select: ['id'],
    });
    const operationIds = operations.map((op) => op.id);
    // Si se piden campos de 'meeting', incluir el objeto meeting
    const meetingFields = fields.filter((f) => f.startsWith('meeting.'));
    if (meetingFields.length > 0) {
      const meeting = await this.meetingRepository.findOne({
        where: { id: meetingId },
      });
      if (meeting) {
        result.meeting = {} as Record<string, any>;
        for (const field of meetingFields) {
          const key = field.split('.')[1];
          const m = meeting as Partial<Meeting>;
          if (key && key in m) {
            result.meeting[key] = m[key as keyof Meeting] ?? null;
          }
        }
      }
    }
    if (operationIds.length === 0) return result;

    // Helper para sumar asientos por tipo de cuenta
    type SumResult = { sum: string | null };
    const sumByAccountType = async (
      accountType: string,
      positiveOnly = false,
      descriptionLike?: string,
    ) => {
      const qb = repo
        .createQueryBuilder('l')
        .where('l.operation_id IN (:...operationIds)', { operationIds })
        .andWhere('l.account_type = :accountType', { accountType });
      if (positiveOnly) qb.andWhere('l.amount > 0');
      if (descriptionLike)
        qb.andWhere('l.description ILIKE :desc', {
          desc: `%${descriptionLike}%`,
        });
      const rawResult = ((await qb
        .select('SUM(l.amount)', 'sum')
        .getRawOne()) as SumResult) || { sum: null };
      const sum = rawResult && rawResult.sum ? Number(rawResult.sum) : 0;
      return sum;
    };

    for (const field of fields) {
      switch (field) {
        case 'totalCash':
          result.totalCash = await sumByAccountType(CASH_ACCOUNT);
          break;
        case 'totalInterest':
          result.totalInterest = await sumByAccountType(
            INTEREST_INCOME_ACCOUNT,
          );
          break;
        case 'totalLoans':
          result.totalLoans = await sumByAccountType(LOANS_RECEIVABLE_ACCOUNT);
          break;
        case 'totalCollected': {
          const cashIn = await sumByAccountType(CASH_ACCOUNT, true);
          const noveltyLoss = await sumByAccountType(NOVELTY_LOSS_ACCOUNT);
          result.totalCollected = cashIn - Math.abs(noveltyLoss);
          break;
        }
        case 'totalDividends':
          result.totalDividends = await sumByAccountType(
            DIVIDENDS_PAYABLE_ACCOUNT,
          );
          break;
        case 'totalStockInvestment':
          result.totalStockInvestment = await sumByAccountType(
            STOCK_CAPITAL_ACCOUNT,
            false,
            'compra',
          );
          break;
        default:
          break;
      }
    }
    return result;
  }
}
