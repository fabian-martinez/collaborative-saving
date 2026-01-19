import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import {
  OperationFilters,
  PaginationOptions,
  PaginatedResult,
} from '@domain/ports/repositories/operation-repository.port';
import { Operation as OperationDomain } from '@domain/entities/operation.entity';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { OperationMapper } from '../mappers/operation.mapper';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { AccountType } from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';

@Injectable()
export class TypeOrmOperationRepository implements OperationRepository {
  constructor(
    @InjectRepository(OperationEntity)
    private readonly repo: Repository<OperationEntity>,
    private readonly transactionManager: TransactionManager,
  ) {}

  // LedgerEntryRepository will be injected via setter or passed as parameter
  private ledgerEntryRepository?: LedgerEntryRepository;

  setLedgerEntryRepository(repo: LedgerEntryRepository): void {
    this.ledgerEntryRepository = repo;
  }

  /**
   * Get the repository to use (with or without active transaction)
   */
  private getRepository(): Repository<OperationEntity> {
    const activeQueryRunner = this.transactionManager.getActiveQueryRunner();
    if (activeQueryRunner) {
      return activeQueryRunner.manager.getRepository(
        OperationEntity,
      ) as Repository<OperationEntity>;
    }
    return this.repo;
  }

  async findById(id: string): Promise<OperationDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({ where: { id } });
    return entity ? OperationMapper.toDomain(entity) : null;
  }

  async findByMeeting(meetingId: string): Promise<OperationDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({ where: { meetingId } });
    return entities.map((e) => OperationMapper.toDomain(e));
  }

  async findByMeetingAndType(
    meetingId: string,
    type: OperationType,
  ): Promise<OperationDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { meetingId, type },
    });
    return entities.map((e) => OperationMapper.toDomain(e));
  }

  async findByMeetingAndTypes(
    meetingId: string,
    types: OperationType[],
  ): Promise<OperationDomain[]> {
    if (types.length === 0) {
      return [];
    }

    const repo = this.getRepository();
    const qb = repo
      .createQueryBuilder('operation')
      .where('operation.meeting_id = :meetingId', { meetingId })
      .andWhere('operation.type IN (:...types)', { types })
      .orderBy('operation.date', 'DESC');

    const entities = await qb.getMany();
    return entities.map((e) => OperationMapper.toDomain(e));
  }

  async findByMember(
    memberId: string,
    filters?: {
      meetingId?: string;
      types?: OperationType[];
    },
  ): Promise<OperationDomain[]> {
    const repo = this.getRepository();
    const qb = repo
      .createQueryBuilder('operation')
      .where('operation.member_id = :memberId', { memberId })
      .orderBy('operation.date', 'DESC');

    if (filters?.meetingId) {
      qb.andWhere('operation.meeting_id = :meetingId', {
        meetingId: filters.meetingId,
      });
    }

    if (filters?.types && filters.types.length > 0) {
      qb.andWhere('operation.type IN (:...types)', {
        types: filters.types,
      });
    }

    const entities = await qb.getMany();
    return entities.map((e) => OperationMapper.toDomain(e));
  }

  async findWithPagination(
    filters: OperationFilters,
    pagination: PaginationOptions,
    orderBy: 'ASC' | 'DESC',
  ): Promise<PaginatedResult<OperationDomain>> {
    const repo = this.getRepository();
    const qb = repo.createQueryBuilder('operation');

    if (filters.memberId) {
      qb.andWhere('operation.member_id = :memberId', {
        memberId: filters.memberId,
      });
    }

    if (filters.meetingId) {
      qb.andWhere('operation.meeting_id = :meetingId', {
        meetingId: filters.meetingId,
      });
    }

    if (filters.startDate) {
      qb.andWhere('operation.date >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      qb.andWhere('operation.date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.type) {
      qb.andWhere('operation.type = :type', { type: filters.type });
    }

    // Get total count before pagination
    const total = await qb.getCount();

    // Apply pagination and ordering
    const skip = (pagination.page - 1) * pagination.limit;
    qb.skip(skip).take(pagination.limit);
    qb.orderBy('operation.date', orderBy);

    const entities = await qb.getMany();
    const data = entities.map((e) => OperationMapper.toDomain(e));

    return { data, total };
  }

  async save(operation: OperationDomain): Promise<OperationDomain> {
    const repo = this.getRepository();
    const persistence = OperationMapper.toPersistence(operation);
    const existing = await repo.findOne({ where: { id: operation.id } });

    if (existing) {
      await repo.update(operation.id, persistence);
      const updated = await repo.findOne({ where: { id: operation.id } });
      if (!updated) {
        throw new Error('Operation not found after update');
      }
      return OperationMapper.toDomain(updated);
    } else {
      const saved = await repo.save(persistence as OperationEntity);
      return OperationMapper.toDomain(saved);
    }
  }

  async saveWithEntries(
    operation: OperationDomain,
    entries: Array<{
      accountType: AccountType;
      amount: number;
      description?: string | null;
    }>,
  ): Promise<OperationDomain> {
    // Save operation first
    const savedOperation = await this.save(operation);

    // Create and save ledger entries
    // Note: This method requires LedgerEntryRepository to be set via setLedgerEntryRepository
    if (!this.ledgerEntryRepository) {
      throw new Error(
        'LedgerEntryRepository not set. Call setLedgerEntryRepository first.',
      );
    }

    const ledgerEntries = entries.map((entry) =>
      LedgerEntry.create({
        operationId: savedOperation.id,
        accountType: entry.accountType,
        amount: entry.amount,
        description: entry.description,
      }),
    );

    // LedgerEntryRepository should handle active transaction internally if properly refactored
    await this.ledgerEntryRepository.saveMany(ledgerEntries);

    return savedOperation;
  }
}
