import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { LoanTransactionDetail as LoanTransactionDetailDomain } from '@domain/entities/loan-transaction-detail.entity';
import { LoanTransactionDetail as LoanTransactionDetailEntity } from '../entities/loan-transaction-detail.entity';
import { LoanTransactionDetailMapper } from '../mappers/loan-transaction-detail.mapper';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import {
  PaginationOptions,
  PaginatedResult,
} from '@domain/ports/repositories/operation-repository.port';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

@Injectable()
export class TypeOrmLoanTransactionDetailRepository implements LoanTransactionDetailRepository {
  constructor(
    @InjectRepository(LoanTransactionDetailEntity)
    private readonly repo: Repository<LoanTransactionDetailEntity>,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Get the repository to use (with or without active transaction)
   */
  private getRepository(): Repository<LoanTransactionDetailEntity> {
    const activeQueryRunner = this.transactionManager.getActiveQueryRunner();
    if (activeQueryRunner) {
      return activeQueryRunner.manager.getRepository(
        LoanTransactionDetailEntity,
      ) as Repository<LoanTransactionDetailEntity>;
    }
    return this.repo;
  }

  async findById(id: string): Promise<LoanTransactionDetailDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({ where: { id } });
    return entity ? LoanTransactionDetailMapper.toDomain(entity) : null;
  }

  async findByLoan(loanId: string): Promise<LoanTransactionDetailDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({ where: { loanId } });
    return entities.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }

  async findByLoanWithPagination(
    loanId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<LoanTransactionDetailDomain>> {
    const repo = this.getRepository();
    const qb = repo.createQueryBuilder('loan_transaction_detail');

    qb.where('loan_transaction_detail.loan_id = :loanId', { loanId });

    const total = await qb.getCount();

    const skip = (pagination.page - 1) * pagination.limit;
    qb.skip(skip).take(pagination.limit);
    qb.orderBy('loan_transaction_detail.transaction_date', 'DESC');

    const entities = await qb.getMany();

    return {
      data: entities.map((e) => LoanTransactionDetailMapper.toDomain(e)),
      total,
    };
  }

  async findByLoans(loanIds: string[]): Promise<LoanTransactionDetailDomain[]> {
    if (!loanIds || loanIds.length === 0) return [];
    const repo = this.getRepository();
    const entities = await repo.find({ where: { loanId: In(loanIds) } });
    return entities.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }

  async findByLoanAndMeeting(
    loanId: string,
    meetingId: string,
  ): Promise<LoanTransactionDetailDomain[]> {
    // Join with operations table to filter by meetingId
    const repo = this.getRepository();
    const entities = await repo
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

  async findByOperationIds(
    operationIds: string[],
  ): Promise<LoanTransactionDetailDomain[]> {
    if (!operationIds || operationIds.length === 0) return [];
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { operationId: In(operationIds) },
    });
    return entities.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }

  async findByLoansAndMeeting(
    loanIds: string[],
    meetingId: string,
  ): Promise<LoanTransactionDetailDomain[]> {
    if (!loanIds.length) {
      return [];
    }
    // Join with operations table to filter by meetingId and multiple loanIds
    const repo = this.getRepository();
    const entities = await repo
      .createQueryBuilder('loan_transaction_detail')
      .innerJoin(
        'operations',
        'operation',
        'operation.id = loan_transaction_detail.operation_id AND operation.meeting_id = :meetingId',
        { meetingId },
      )
      .where('loan_transaction_detail.loan_id IN (:...loanIds)', { loanIds })
      .getMany();
    return entities.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }

  async save(
    transaction: LoanTransactionDetailDomain,
  ): Promise<LoanTransactionDetailDomain> {
    const repo = this.getRepository();
    const persistence = LoanTransactionDetailMapper.toPersistence(transaction);
    const existing = await repo.findOne({
      where: { id: transaction.id },
    });

    if (existing) {
      await repo.update(transaction.id, persistence);
      const updated = await repo.findOne({
        where: { id: transaction.id },
      });
      if (!updated) {
        throw new Error('LoanTransactionDetail not found after update');
      }
      return LoanTransactionDetailMapper.toDomain(updated);
    } else {
      const saved = await repo.save(persistence as LoanTransactionDetailEntity);
      return LoanTransactionDetailMapper.toDomain(saved);
    }
  }

  async saveMany(
    transactions: LoanTransactionDetailDomain[],
  ): Promise<LoanTransactionDetailDomain[]> {
    const repo = this.getRepository();
    const persistences = transactions.map((t) =>
      LoanTransactionDetailMapper.toPersistence(t),
    );
    const saved = await repo.save(
      persistences as LoanTransactionDetailEntity[],
    );
    return saved.map((e) => LoanTransactionDetailMapper.toDomain(e));
  }
}
