import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { LoanTransactionDetail } from '../../../loans/entities/loan-transaction-detail.entity';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { Operation } from '../../../operations/entities/operation.entity';

@Injectable()
export class TypeOrmLoanTransactionDetailRepository
  implements LoanTransactionDetailRepository
{
  constructor(
    @InjectRepository(LoanTransactionDetail)
    private readonly repo: Repository<LoanTransactionDetail>,
  ) {}

  async findById(id: string): Promise<LoanTransactionDetail | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async findByLoan(loanId: string): Promise<LoanTransactionDetail[]> {
    return await this.repo.find({
      where: { loan_id: loanId },
      order: { transaction_date: 'DESC' },
    });
  }

  async findByLoanAndMeeting(
    loanId: string,
    meetingId: string,
  ): Promise<LoanTransactionDetail[]> {
    return await this.repo
      .createQueryBuilder('ltd')
      .innerJoin(Operation, 'op', 'ltd.operation_id = op.id')
      .where('ltd.loan_id = :loanId', { loanId })
      .andWhere('op.meeting_id = :meetingId', { meetingId })
      .getMany();
  }

  async findByLoanAndTransactionType(
    loanId: string,
    transactionType: TransactionType,
    meetingId: string,
  ): Promise<boolean> {
    const exists = await this.repo
      .createQueryBuilder('ltd')
      .innerJoin(Operation, 'op', 'ltd.operation_id = op.id')
      .where('ltd.loan_id = :loanId', { loanId })
      .andWhere('ltd.transaction_type = :transactionType', { transactionType })
      .andWhere('op.meeting_id = :meetingId', { meetingId })
      .getExists();
    return exists;
  }

  async save(
    transaction: Partial<LoanTransactionDetail>,
  ): Promise<LoanTransactionDetail> {
    const entity = this.repo.create(transaction);
    return await this.repo.save(entity);
  }

  async saveMany(
    transactions: Partial<LoanTransactionDetail>[],
  ): Promise<LoanTransactionDetail[]> {
    const entities = this.repo.create(transactions);
    return await this.repo.save(entities);
  }
}
