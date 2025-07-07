import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, QueryRunner, Repository } from 'typeorm';
import { CreateMandatoryContributionDto } from './dto/create-mandatory-contribution.dto';
import { MandatoryContribution } from './entities/mandatory-contribution.entity';
import { UpdateMandatoryContributionDto } from './dto/update-mandatory-contribution.dto';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { SimplifiedRecordTransactionsDto } from './dto/simplified-record-transactions.dto';
import {
  Operation,
  OperationTypeEnum,
} from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  FEE_INCOME_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  PENDING_CLASSIFICATION_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '../common/constants/account-types';
import { LoansService } from '../loans/loans.service';
import { Meeting } from './entities/meeting.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Stock } from '../stocks/entities/stock.entity';
import { StockValueHistory } from '../stocks/entities/stock-value-history.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { LoanTransactionDetail } from '../loans/entities/loan-transaction-detail.entity';
import { Member } from '../members/entities/member.entity';
import { Loan } from '../loans/entities/loan.entity';

export interface MemberDue {
  type: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee';
  description: string;
  amount: number;
  referenceId?: string;
  details?: {
    interest: number;
    principal: number;
    outstanding_balance: number;
  };
  monthlyContribution?: number;
  stockQuantity?: number;
}

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(MandatoryContribution)
    private readonly mandatoryContributionRepository: Repository<MandatoryContribution>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly loansService: LoansService,
    private readonly dataSource: DataSource,
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

  async getMemberDues(memberId: string): Promise<MemberDue[]> {
    const dues: MemberDue[] = [];

    // 1. Mandatory fund contributions
    const mandatoryContributions =
      await this.mandatoryContributionRepository.find({
        where: { value: MoreThan(0) },
      });

    for (const contribution of mandatoryContributions) {
      dues.push({
        type: 'mandatory_contribution',
        description: contribution.asset_type,
        amount: Number(contribution.value),
      });
    }

    // 2. Subscribed stock fees
    const activeSubscriptions =
      await this.stockSubscriptionsService.findActiveByMember(memberId);

    for (const subscription of activeSubscriptions) {
      if (subscription.stock && subscription.stock.monthly_contribution > 0) {
        dues.push({
          type: 'stock_fee',
          description: `Cuota de acción: ${subscription.stock.type}`,
          amount:
            subscription.quantity * subscription.stock.monthly_contribution,
        });
      }
    }

    // 3. Active loan payments
    const activeLoans = await this.loansService.findActiveByMember(memberId);

    for (const loan of activeLoans) {
      const interestDue = loan.outstanding_balance * loan.interest_rate;
      const principalDue = Number(loan.monthly_payment_amount);

      dues.push({
        type: 'loan_payment',
        description: `Cuota préstamo ${loan.loan_type}`,
        amount: Number(loan.monthly_payment_amount),
        referenceId: loan.id,
        details: {
          interest: interestDue,
          principal: principalDue,
          outstanding_balance: loan.outstanding_balance - principalDue,
        },
      });
    }

    return dues;
  }

  async getMemberDuesForActiveMeeting(memberId: string): Promise<MemberDue[]> {
    const activeMeeting = await this.findActive();
    if (!activeMeeting) {
      throw new NotFoundException('No active meeting found.');
    }

    const member = await this.dataSource.manager.findOne(Member, {
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found.`);
    }

    const dues: MemberDue[] = [];

    // --- Aportes y cuotas fijas ---
    const mandatoryContributions =
      await this.mandatoryContributionRepository.find({
        where: { value: MoreThan(0) },
      });

    for (const contribution of mandatoryContributions) {
      dues.push({
        type: 'mandatory_contribution',
        description: contribution.asset_type,
        amount: Number(contribution.value),
      });
    }

    // --- Cuotas de acciones suscritas ---
    const subscriptions = await this.dataSource.manager.find(
      StockSubscription,
      {
        where: { member_id: memberId },
        relations: ['stock'],
      },
    );

    for (const subscription of subscriptions) {
      const dueAmount =
        subscription.quantity * Number(subscription.stock.monthly_contribution);
      if (dueAmount > 0) {
        dues.push({
          type: 'stock_fee',
          description: `Cuota de acción: ${subscription.stock.type}`,
          amount: dueAmount,
          referenceId: subscription.stock.id,
          monthlyContribution: Number(subscription.stock.monthly_contribution),
          stockQuantity: subscription.quantity,
        });
      }
    }

    // --- Cuotas de préstamos activos ---
    const loans = await this.dataSource.manager.find(Loan, {
      where: { member_id: memberId, status: 'active' },
      relations: ['transactions'],
    });

    for (const loan of loans) {
      if (
        loan.outstanding_balance > 0 &&
        loan.payment_status_this_month !== 'PAID'
      ) {
        const interestComponent =
          Number(loan.outstanding_balance) * Number(loan.interest_rate);
        const principalComponent = Number(loan.monthly_payment_amount);
        const totalPaymentDue = principalComponent + interestComponent;

        dues.push({
          type: 'loan_payment',
          description: `Cuota préstamo: ${loan.loan_type}`,
          amount: totalPaymentDue,
          referenceId: loan.id,
          details: {
            interest: interestComponent,
            principal: principalComponent,
            outstanding_balance: Number(loan.outstanding_balance),
          },
        });
      }
    }

    return dues;
  }

  async findMonthlyPaymentsByMeeting(meetingId: string): Promise<Operation[]> {
    return this.dataSource.manager.getRepository(Operation).find({
      where: {
        meeting_id: meetingId,
        type: 'MONTHLY_PAYMENT',
      },
      relations: ['member', 'ledger_entries'],
    });
  }

  async revaluateAssets(meetingId: string): Promise<{
    revaluationRate: number;
    newStockValues: { type: string; value: number }[];
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ledgerEntries = await queryRunner.manager.find(LedgerEntry, {
        relations: { operation: true },
        where: { operation: { meeting_id: meetingId } },
      });

      const totalInterestIncome = ledgerEntries
        .filter((e) => e.account_type === INTEREST_INCOME_ACCOUNT)
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

      const totalCapitalContributions = ledgerEntries
        .filter((e) => e.account_type === STOCK_CAPITAL_ACCOUNT)
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

      const masaADistribuir = totalInterestIncome + totalCapitalContributions;

      const allSubscriptions = await queryRunner.manager.find(
        StockSubscription,
        {
          relations: { stock: true },
        },
      );

      const capitalBaseTotal = allSubscriptions.reduce(
        (sum, s) => sum + s.quantity * Number(s.stock.value),
        0,
      );

      if (capitalBaseTotal === 0) {
        throw new BadRequestException(
          'Capital base is zero, cannot revaluate.',
        );
      }

      const revaluationRate = masaADistribuir / capitalBaseTotal;

      const stocks = await queryRunner.manager.find(Stock);
      const newStockValues: { type: string; value: number }[] = [];

      for (const stock of stocks) {
        const newValue = Number(stock.value) * (1 + revaluationRate);
        newStockValues.push({ type: stock.type, value: newValue });

        const historyEntry = queryRunner.manager.create(StockValueHistory, {
          stock_id: stock.id,
          value: newValue,
        });
        await queryRunner.manager.save(historyEntry);

        await queryRunner.manager.update(Stock, stock.id, { value: newValue });
      }

      await queryRunner.commitTransaction();

      return { revaluationRate, newStockValues };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error during asset revaluation', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async recordMonthlyPayment(
    recordTransactionsDto: SimplifiedRecordTransactionsDto,
  ): Promise<Operation> {
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
          type: 'MONTHLY_PAYMENT',
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
        'MONTHLY_PAYMENT',
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

      await queryRunner.commitTransaction();
      return operation;
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
    type: OperationTypeEnum | null,
  ): Promise<Operation> {
    const operation = queryRunner.manager.create(Operation, {
      meeting_id: meetingId,
      member_id: memberId,
      description: `Registro de transacciones para el socio ${memberId} en la reunión ${meetingId}.`,
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

    ledgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: CASH_ACCOUNT,
        amount: payment.amount,
        description: `Entrada de efectivo para: ${payment.description}`,
      }),
    );

    switch (payment.type) {
      case 'mandatory_contribution':
        ledgerEntries.push(
          ...this._processMandatoryContribution(
            queryRunner,
            operation,
            payment,
          ),
        );
        break;
      case 'stock_fee':
        ledgerEntries.push(
          ...this._processStockFee(queryRunner, operation, payment),
        );
        break;
      case 'loan_payment': {
        const loanEntries = await this._processLoanPayment(
          queryRunner,
          operation,
          payment,
        );
        ledgerEntries.push(...loanEntries);
        break;
      }
      case 'fee':
        ledgerEntries.push(
          ...this._processFee(queryRunner, operation, payment),
        );
        break;
      default:
        this.logger.warn(
          `Unhandled payment type received. Using pending classification account.`,
        );
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id: operation.id,
            account_type: PENDING_CLASSIFICATION_ACCOUNT,
            amount: -payment.amount,
            description: `Clasificación pendiente para: ${payment.description}`,
          }),
        );
        break;
    }

    return ledgerEntries;
  }

  private _processMandatoryContribution(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): LedgerEntry[] {
    return [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
        amount: -payment.amount,
        description: payment.description,
      }),
    ];
  }

  private _processStockFee(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): LedgerEntry[] {
    return [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: STOCK_CAPITAL_ACCOUNT,
        amount: -payment.amount,
        description: payment.description,
      }),
    ];
  }

  private async _processLoanPayment(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): Promise<LedgerEntry[]> {
    if (!payment.referenceId) {
      throw new BadRequestException('Loan payment must include a referenceId.');
    }

    const loan = await this.loansService.findOne(payment.referenceId);
    const interestDue = loan.outstanding_balance * loan.interest_rate;
    const interestPaid = Math.min(payment.amount, interestDue);
    const principalPaid = payment.amount - interestPaid;

    const ledgerEntries: LedgerEntry[] = [];

    if (interestPaid > 0) {
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          account_type: INTEREST_INCOME_ACCOUNT,
          amount: -interestPaid,
          description: `Pago de interés para: ${payment.description}`,
        }),
      );
      const interestTransaction = queryRunner.manager.create(
        LoanTransactionDetail,
        {
          loan_id: loan.id,
          operation_id: operation.id,
          transaction_type: 'pago_interes',
          amount: interestPaid,
        },
      );
      await queryRunner.manager.save(interestTransaction);
    }

    if (principalPaid > 0) {
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          account_type: LOANS_RECEIVABLE_ACCOUNT,
          amount: -principalPaid,
          description: `Abono a capital para: ${payment.description}`,
        }),
      );
      const principalTransaction = queryRunner.manager.create(
        LoanTransactionDetail,
        {
          loan_id: loan.id,
          operation_id: operation.id,
          transaction_type: 'abono_capital',
          amount: principalPaid,
        },
      );
      await queryRunner.manager.save(principalTransaction);
    }

    return ledgerEntries;
  }

  private _processFee(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): LedgerEntry[] {
    return [
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: FEE_INCOME_ACCOUNT,
        amount: -payment.amount,
        description: payment.description,
      }),
    ];
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

  // CRUD for Mandatory Contributions

  createMandatoryContribution(
    createDto: CreateMandatoryContributionDto,
  ): Promise<MandatoryContribution> {
    const contribution = this.mandatoryContributionRepository.create(createDto);
    return this.mandatoryContributionRepository.save(contribution);
  }

  findAllMandatoryContributions(): Promise<MandatoryContribution[]> {
    return this.mandatoryContributionRepository.find();
  }

  async findOneMandatoryContribution(
    id: string,
  ): Promise<MandatoryContribution> {
    const contribution = await this.mandatoryContributionRepository.findOneBy({
      id,
    });
    if (!contribution) {
      throw new NotFoundException(`Mandatory Contribution #${id} not found`);
    }
    return contribution;
  }

  async updateMandatoryContribution(
    id: string,
    updateDto: UpdateMandatoryContributionDto,
  ): Promise<MandatoryContribution> {
    await this.mandatoryContributionRepository.update(id, updateDto);
    return this.findOneMandatoryContribution(id);
  }

  async removeMandatoryContribution(id: string): Promise<void> {
    await this.mandatoryContributionRepository.delete(id);
  }
}
