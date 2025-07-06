import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { CreateMandatoryContributionDto } from './dto/create-mandatory-contribution.dto';
import { MandatoryContribution } from './entities/mandatory-contribution.entity';
import { UpdateMandatoryContributionDto } from './dto/update-mandatory-contribution.dto';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { SimplifiedRecordTransactionsDto } from './dto/simplified-record-transactions.dto';
import { Operation } from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '../common/constants/account-types';
import { LoansService } from '../loans/loans.service';
import { Loan } from '../loans/entities/loan.entity';
import { Meeting } from './entities/meeting.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Stock } from '../stocks/entities/stock.entity';
import { StockValueHistory } from '../stocks/entities/stock-value-history.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';

export interface MemberDue {
  type: 'mandatory_contribution' | 'stock_fee';
  description: string;
  amount: number;
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

  async getMemberDues(memberId: string): Promise<MemberDue[]> {
    const dues: MemberDue[] = [];

    // 1. Mandatory fund contributions
    const mandatoryContributions =
      await this.mandatoryContributionRepository.find({
        where: { total: MoreThan(0) },
      });

    for (const contribution of mandatoryContributions) {
      dues.push({
        type: 'mandatory_contribution',
        description: contribution.asset_type,
        amount: contribution.total,
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

    return dues;
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

  async recordTransactions(
    recordTransactionsDto: SimplifiedRecordTransactionsDto,
  ): Promise<Operation> {
    const { memberId, payments } = recordTransactionsDto;

    const activeMeeting = await this.meetingRepository.findOne({
      where: { status: 'active' },
    });

    if (!activeMeeting) {
      throw new NotFoundException('No active meeting found.');
    }
    const meetingId = activeMeeting.id;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create a single master operation
      const operation = queryRunner.manager.create(Operation, {
        meeting_id: meetingId,
        member_id: memberId,
        description: `Registro de transacciones para el socio ${memberId} en la reunión ${meetingId}.`,
      });
      await queryRunner.manager.save(operation);

      // 2. Process payments and create ledger entries
      const ledgerEntries: LedgerEntry[] = [];
      for (const payment of payments) {
        // --- DEBIT (always to cash for now) ---
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id: operation.id,
            account_type: CASH_ACCOUNT,
            amount: payment.amount,
          }),
        );

        // --- CREDIT (logic depends on payment type) ---
        switch (payment.type) {
          case 'mandatory_contribution': {
            ledgerEntries.push(
              queryRunner.manager.create(LedgerEntry, {
                operation_id: operation.id,
                account_type: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
                amount: -payment.amount,
              }),
            );
            break;
          }
          case 'stock_fee': {
            ledgerEntries.push(
              queryRunner.manager.create(LedgerEntry, {
                operation_id: operation.id,
                account_type: STOCK_CAPITAL_ACCOUNT,
                amount: -payment.amount,
              }),
            );
            break;
          }
          case 'loan_payment': {
            if (!payment.referenceId) {
              throw new BadRequestException(
                'Loan payment must include a referenceId.',
              );
            }
            const loan = await this.loansService.findOne(payment.referenceId);
            const interestDue = loan.outstanding_balance * loan.interest_rate;
            const interestPaid = Math.min(payment.amount, interestDue);
            const principalPaid = payment.amount - interestPaid;

            if (interestPaid > 0) {
              ledgerEntries.push(
                queryRunner.manager.create(LedgerEntry, {
                  operation_id: operation.id,
                  account_type: INTEREST_INCOME_ACCOUNT,
                  amount: -interestPaid,
                }),
              );
            }

            if (principalPaid > 0) {
              ledgerEntries.push(
                queryRunner.manager.create(LedgerEntry, {
                  operation_id: operation.id,
                  account_type: LOANS_RECEIVABLE_ACCOUNT,
                  amount: -principalPaid,
                }),
              );
              // Update loan balance
              await queryRunner.manager.update(Loan, loan.id, {
                outstanding_balance: loan.outstanding_balance - principalPaid,
              });
            }
            break;
          }
        }
      }
      await queryRunner.manager.save(ledgerEntries);

      await queryRunner.commitTransaction();
      return operation;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error recording transaction', err);
      // Re-throw the original error to be handled by NestJS default exception layer
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  create(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
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
