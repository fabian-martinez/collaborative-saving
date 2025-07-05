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
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly dataSource: DataSource,
  ) {}

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
        // Loans are not tied to a specific meeting
        meeting_id: null,
        description: `Loan disbursement for member ${createLoanDto.member_id}`,
      });
      await runner.manager.save(operation);

      // 3. Create Loan entity
      const loan = runner.manager.create(Loan, {
        ...createLoanDto,
        outstanding_balance:
          createLoanDto.outstanding_balance ?? createLoanDto.approved_amount,
        operation_id: operation.id,
      });
      await runner.manager.save(loan);

      // 4. Create Ledger Entries (Double-entry)
      const debitEntry = runner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: LOANS_RECEIVABLE_ACCOUNT,
        amount: createLoanDto.approved_amount, // Debit
      });

      const creditEntry = runner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: CASH_ACCOUNT,
        amount: -createLoanDto.approved_amount, // Credit
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

  findAll(): Promise<Loan[]> {
    return this.loanRepository.find();
  }

  async findOne(id: string): Promise<Loan> {
    const loan = await this.loanRepository.findOneBy({ id });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return loan;
  }

  async update(id: string, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.loanRepository.preload({
      id,
      ...updateLoanDto,
    });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return this.loanRepository.save(loan);
  }

  async remove(id: string): Promise<void> {
    const result = await this.loanRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
  }
}
