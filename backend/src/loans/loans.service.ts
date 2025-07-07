import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { LoanTransactionDetail } from './entities/loan-transaction-detail.entity';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { Operation } from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '../common/constants/account-types';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanTransactionDetail)
    private readonly loanTransactionDetailRepository: Repository<LoanTransactionDetail>,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly dataSource: DataSource,
  ) {}

  private async calculateOutstandingBalance(
    loanId: string,
    runner?: QueryRunner,
  ): Promise<number> {
    const manager = runner ? runner.manager : this.dataSource.manager;

    const transactions = await manager.find(LoanTransactionDetail, {
      where: { loan_id: loanId },
    });

    return transactions.reduce((balance, t) => {
      if (t.transaction_type === 'desembolso') {
        return balance + Number(t.amount);
      }
      if (t.transaction_type === 'abono_capital') {
        return balance - Number(t.amount);
      }
      return balance;
    }, 0);
  }

  private async populateLoansWithBalance(
    loans: Loan[],
    runner?: QueryRunner,
  ): Promise<Loan[]> {
    await Promise.all(
      loans.map(async (loan) => {
        loan.outstanding_balance = await this.calculateOutstandingBalance(
          loan.id,
          runner,
        );
      }),
    );
    return loans;
  }

  async create(
    createLoanDto: CreateLoanDto,
    queryRunner?: QueryRunner,
  ): Promise<Loan> {
    const isTransactionManaged = !!queryRunner;
    const runner = isTransactionManaged
      ? queryRunner
      : this.dataSource.createQueryRunner();

    if (!isTransactionManaged) {
      await runner.connect();
      await runner.startTransaction();
    }

    try {
      // 1. Validate member's capital
      const memberSubscriptions = await (isTransactionManaged
        ? runner.manager.find(StockSubscription, {
            where: { member_id: createLoanDto.member_id },
            relations: { stock: true },
          })
        : this.stockSubscriptionsService.findByMember(createLoanDto.member_id));

      const totalCapital = memberSubscriptions.reduce(
        (sum, s) => sum + s.quantity * Number(s.stock.value),
        0,
      );

      if (createLoanDto.approved_amount > totalCapital) {
        throw new BadRequestException(
          `Requested loan amount (${createLoanDto.approved_amount}) exceeds member's total capital (${totalCapital}).`,
        );
      }

      // 2. Create Operation
      const operation = runner.manager.create(Operation, {
        member_id: createLoanDto.member_id,
        meeting_id: null,
        description: `Loan disbursement for member ${createLoanDto.member_id}`,
        type: 'LOAN_DISBURSEMENT',
      });
      await runner.manager.save(operation);

      // 3. Create Loan entity
      const loanEntity = runner.manager.create(Loan, createLoanDto);
      const loan = await runner.manager.save(loanEntity);

      // 4. Create disbursement transaction
      const disbursement = runner.manager.create(LoanTransactionDetail, {
        loan_id: loan.id,
        operation_id: operation.id,
        transaction_type: 'desembolso',
        amount: createLoanDto.approved_amount,
      });
      await runner.manager.save(disbursement);

      // 5. Create Ledger Entries
      const debitEntry = runner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: LOANS_RECEIVABLE_ACCOUNT,
        amount: createLoanDto.approved_amount,
      });

      const creditEntry = runner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: CASH_ACCOUNT,
        amount: -createLoanDto.approved_amount,
      });

      await runner.manager.save([debitEntry, creditEntry]);

      if (!isTransactionManaged) {
        await runner.commitTransaction();
      }

      return loan;
    } catch (err) {
      if (!isTransactionManaged) {
        await runner.rollbackTransaction();
      }
      throw err;
    } finally {
      if (!isTransactionManaged) {
        await runner.release();
      }
    }
  }

  async findAll(): Promise<Loan[]> {
    const loans = await this.loanRepository.find();
    return this.populateLoansWithBalance(loans);
  }

  async findActiveByMember(memberId: string): Promise<Loan[]> {
    const loans = await this.loanRepository.find({
      where: {
        member_id: memberId,
        status: 'active',
      },
    });
    return this.populateLoansWithBalance(loans);
  }

  async findOne(id: string): Promise<Loan> {
    const loan = await this.loanRepository.findOneBy({ id });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    const [populatedLoan] = await this.populateLoansWithBalance([loan]);
    return populatedLoan;
  }

  async update(id: string, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.loanRepository.preload({
      id,
      ...updateLoanDto,
    });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    const savedLoan = await this.loanRepository.save(loan);
    const [populatedLoan] = await this.populateLoansWithBalance([savedLoan]);
    return populatedLoan;
  }

  async remove(id: string): Promise<void> {
    const result = await this.loanRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
  }
}
