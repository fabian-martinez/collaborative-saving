import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { LoanTransactionDetail as LoanTransactionDetailDomain } from '@domain/entities/loan-transaction-detail.entity';
import { LoanTransactionDetail as LoanTransactionDetailEntity } from '../entities/loan-transaction-detail.entity';
import { LoanTransactionDetailMapper } from '../mappers/loan-transaction-detail.mapper';
import { Operation as OperationEntity } from '../entities/operation.entity';

@Injectable()
export class TypeOrmLoanTransactionDetailRepository implements LoanTransactionDetailRepository {
  constructor(
    @InjectRepository(LoanTransactionDetailEntity)
    private readonly repo: Repository<LoanTransactionDetailEntity>,
  ) {}

  async findById(id: string): Promise<LoanTransactionDetailDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? LoanTransactionDetailMapper.toDomain(entity) : null;
  }

  async findByLoan(loanId: string): Promise<LoanTransactionDetailDomain[]> {
    const entities = await this.repo.find({ where: { loanId } });
    return entities.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }

  async findByLoanAndMeeting(
    loanId: string,
    meetingId: string,
  ): Promise<LoanTransactionDetailDomain[]> {
    // Join with operations table to filter by meetingId
    const entities = await this.repo
      .createQueryBuilder('loan_transaction_detail')
      .innerJoin(
        'operations',
        'operation',
        'operation.id = loan_transaction_detail.operation_id AND operation.meeting_id = :meetingId',
        { meetingId },
      )
      .where('loan_transaction_detail.loan_id = :loanId', { loanId })
      .getMany();
    return entities.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }

  async save(
    transaction: LoanTransactionDetailDomain,
  ): Promise<LoanTransactionDetailDomain> {
    const persistence = LoanTransactionDetailMapper.toPersistence(transaction);
    const existing = await this.repo.findOne({
      where: { id: transaction.id },
    });

    if (existing) {
      await this.repo.update(transaction.id, persistence);
      const updated = await this.repo.findOne({
        where: { id: transaction.id },
      });
      if (!updated) {
        throw new Error('LoanTransactionDetail not found after update');
      }
      return LoanTransactionDetailMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(
        persistence as LoanTransactionDetailEntity,
      );
      return LoanTransactionDetailMapper.toDomain(saved);
    }
  }

  async saveMany(
    transactions: LoanTransactionDetailDomain[],
  ): Promise<LoanTransactionDetailDomain[]> {
    const persistences = transactions.map((t) =>
      LoanTransactionDetailMapper.toPersistence(t),
    );
    const saved = await this.repo.save(
      persistences as LoanTransactionDetailEntity[],
    );
    return saved.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }
}
