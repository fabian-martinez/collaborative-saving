import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateLoanTransactionDto } from './dto/create-loan-transaction.dto';
import { UpdateLoanTransactionDto } from './dto/update-loan-transaction.dto';
import { LoanTransactionDetail } from '../loans/entities/loan-transaction-detail.entity';
import { LoansService } from '../loans/loans.service';
import {
  Operation,
  OperationTypeEnum,
} from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '../common/constants/account-types';

@Injectable()
export class LoanTransactionsService {
  constructor(
    @InjectRepository(LoanTransactionDetail)
    private readonly loanTransactionRepository: Repository<LoanTransactionDetail>,
    private readonly loansService: LoansService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createLoanTransactionDto: CreateLoanTransactionDto,
  ): Promise<LoanTransactionDetail> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const { loan_id, transaction_type, amount, notes } =
      createLoanTransactionDto;

    try {
      const loan = await this.loansService.findOne(loan_id);
      const member_id = loan.member_id;

      let operationType: OperationTypeEnum = 'UNDEFINED';
      switch (transaction_type) {
        case 'desembolso':
          operationType = 'LOAN_DISBURSEMENT';
          break;
        case 'abono_capital':
        case 'pago_interes':
          operationType = 'LOAN_PAYMENT';
          break;
        default:
          throw new BadRequestException(
            `Tipo de transacción inválido: ${transaction_type}`,
          );
      }

      // 1. Crear Operación
      const operation = queryRunner.manager.create(Operation, {
        member_id: member_id,
        meeting_id: '00000000-0000-0000-0000-000000000000', // Las transacciones de préstamos son independientes de reuniones
        description:
          notes ||
          `Transacción de ${transaction_type} para el crédito ${loan_id}`,
        type: operationType,
      });
      await queryRunner.manager.save(operation);
      const operation_id = operation.id;

      const ledgerEntries: LedgerEntry[] = [];
      let newOutstandingBalance = parseFloat(
        loan.outstanding_balance.toString(),
      );

      // 2. Business Logic per transaction type
      switch (transaction_type) {
        case 'desembolso':
          newOutstandingBalance += amount;
          ledgerEntries.push(
            queryRunner.manager.create(LedgerEntry, {
              operation_id,
              account_type: LOANS_RECEIVABLE_ACCOUNT,
              amount,
            }),
            queryRunner.manager.create(LedgerEntry, {
              operation_id,
              account_type: CASH_ACCOUNT,
              amount: -amount,
            }),
          );
          break;

        case 'abono_capital':
          newOutstandingBalance -= amount;
          ledgerEntries.push(
            queryRunner.manager.create(LedgerEntry, {
              operation_id,
              account_type: CASH_ACCOUNT,
              amount,
            }),
            queryRunner.manager.create(LedgerEntry, {
              operation_id,
              account_type: LOANS_RECEIVABLE_ACCOUNT,
              amount: -amount,
            }),
          );
          break;

        case 'pago_interes':
          // Interest payment does not affect the loan's outstanding balance
          ledgerEntries.push(
            queryRunner.manager.create(LedgerEntry, {
              operation_id,
              account_type: CASH_ACCOUNT,
              amount,
            }),
            queryRunner.manager.create(LedgerEntry, {
              operation_id,
              account_type: INTEREST_INCOME_ACCOUNT,
              amount: -amount,
            }),
          );
          break;

        default:
          throw new BadRequestException(
            `Tipo de transacción inválido: ${String(transaction_type)}`,
          );
      }

      // 3. Save Ledger Entries
      await queryRunner.manager.save(ledgerEntries);

      // 4. Update Loan Balance
      await queryRunner.manager.update(
        'loans',
        { id: loan_id },
        { outstanding_balance: newOutstandingBalance },
      );

      // 5. Create Loan Transaction Detail
      const transactionDetail = queryRunner.manager.create(
        LoanTransactionDetail,
        {
          ...createLoanTransactionDto,
          operation_id: operation.id, // Link to the master operation
        },
      );
      await queryRunner.manager.save(transactionDetail);

      await queryRunner.commitTransaction();
      return transactionDetail;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll(): Promise<LoanTransactionDetail[]> {
    return this.loanTransactionRepository.find();
  }

  async findOne(id: string): Promise<LoanTransactionDetail> {
    const transaction = await this.loanTransactionRepository.findOneBy({ id });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }
    return transaction;
  }

  async update(
    id: string,
    updateLoanTransactionDto: UpdateLoanTransactionDto,
  ): Promise<LoanTransactionDetail> {
    const transaction = await this.loanTransactionRepository.preload({
      id,
      ...updateLoanTransactionDto,
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }
    return this.loanTransactionRepository.save(transaction);
  }

  async remove(id: string): Promise<void> {
    const result = await this.loanTransactionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }
  }
}
