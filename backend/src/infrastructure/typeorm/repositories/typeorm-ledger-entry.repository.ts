import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import {
  LedgerEntryFilters,
  PaginationOptions,
  PaginatedResult,
  AccountsSummaryFilters,
  AccountSummaryData,
} from '@domain/ports/repositories/ledger-entry-repository.port';
import { AccountType } from '@domain/constants/account-types';
import { LedgerEntry as LedgerEntryDomain } from '@domain/entities/ledger-entry.entity';
import { LedgerEntry as LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { LedgerEntryMapper } from '../mappers/ledger-entry.mapper';
import { Operation as OperationEntity } from '../entities/operation.entity';

@Injectable()
export class TypeOrmLedgerEntryRepository implements LedgerEntryRepository {
  constructor(
    @InjectRepository(LedgerEntryEntity)
    private readonly repo: Repository<LedgerEntryEntity>,
    @InjectRepository(OperationEntity)
    private readonly operationRepo: Repository<OperationEntity>,
  ) {}

  async findById(id: string): Promise<LedgerEntryDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? LedgerEntryMapper.toDomain(entity) : null;
  }

  async findByOperation(operationId: string): Promise<LedgerEntryDomain[]> {
    const entities = await this.repo.find({ where: { operationId } });
    return entities.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async findByOperations(operationIds: string[]): Promise<LedgerEntryDomain[]> {
    if (operationIds.length === 0) {
      return [];
    }
    const entities = await this.repo
      .createQueryBuilder('ledger_entry')
      .where('ledger_entry.operation_id IN (:...operationIds)', {
        operationIds,
      })
      .getMany();
    return entities.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async findByMeeting(meetingId: string): Promise<LedgerEntryDomain[]> {
    // Join with operations to filter by meeting
    const entities = await this.repo
      .createQueryBuilder('ledger_entry')
      .innerJoin('ledger_entry.operation', 'operation')
      .where('operation.meeting_id = :meetingId', { meetingId })
      .getMany();
    return entities.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async findByAccountType(accountType: string): Promise<LedgerEntryDomain[]> {
    const entities = await this.repo.find({ where: { accountType } });
    return entities.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async save(entry: LedgerEntryDomain): Promise<LedgerEntryDomain> {
    const persistence = LedgerEntryMapper.toPersistence(entry);
    const existing = await this.repo.findOne({ where: { id: entry.id } });

    if (existing) {
      await this.repo.update(entry.id, persistence);
      const updated = await this.repo.findOne({ where: { id: entry.id } });
      if (!updated) {
        throw new Error('LedgerEntry not found after update');
      }
      return LedgerEntryMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(persistence as LedgerEntryEntity);
      return LedgerEntryMapper.toDomain(saved);
    }
  }

  async saveMany(entries: LedgerEntryDomain[]): Promise<LedgerEntryDomain[]> {
    const persistences = entries.map((e) => LedgerEntryMapper.toPersistence(e));
    const saved = await this.repo.save(persistences as LedgerEntryEntity[]);
    return saved.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async sumByAccountType(accountType: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('ledger_entry')
      .select('SUM(ledger_entry.amount)', 'sum')
      .where('ledger_entry.accountType = :accountType', { accountType })
      .getRawOne<{ sum: string | null }>();

    return Number(result && result.sum ? result.sum : 0);
  }

  async findWithPagination(
    filters: LedgerEntryFilters,
    pagination: PaginationOptions,
    orderBy: 'ASC' | 'DESC',
  ): Promise<PaginatedResult<LedgerEntryDomain>> {
    const qb = this.repo.createQueryBuilder('ledger_entry');

    // Only join with operations if we need to filter by memberId
    if (filters.memberId) {
      qb.leftJoin(
        OperationEntity,
        'operation',
        'operation.id = ledger_entry.operation_id',
      );
      qb.andWhere('operation.member_id = :memberId', {
        memberId: filters.memberId,
      });
    }

    if (filters.accountType) {
      qb.andWhere('ledger_entry.account_type = :accountType', {
        accountType: filters.accountType,
      });
    }

    if (filters.startDate) {
      qb.andWhere('ledger_entry.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      qb.andWhere('ledger_entry.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Get total count before pagination
    const total = await qb.getCount();

    // Apply pagination and ordering
    const skip = (pagination.page - 1) * pagination.limit;
    qb.skip(skip).take(pagination.limit);
    qb.orderBy('ledger_entry.created_at', orderBy);

    const entities = await qb.getMany();
    const data = entities.map((e) => LedgerEntryMapper.toDomain(e));

    return { data, total };
  }

  async getAccountsSummary(
    filters: AccountsSummaryFilters,
    entriesLimit: number,
  ): Promise<AccountSummaryData[]> {
    // Step 1: Get aggregated data grouped by account type
    const summaryQb = this.repo
      .createQueryBuilder('ledger_entry')
      .select('ledger_entry.account_type', 'accountType')
      .addSelect('SUM(ledger_entry.amount)', 'totalBalance')
      .addSelect(
        'SUM(CASE WHEN ledger_entry.amount > 0 THEN ledger_entry.amount ELSE 0 END)',
        'totalDebits',
      )
      .addSelect(
        'SUM(CASE WHEN ledger_entry.amount < 0 THEN ABS(ledger_entry.amount) ELSE 0 END)',
        'totalCredits',
      )
      .addSelect('COUNT(*)', 'entriesCount')
      .groupBy('ledger_entry.account_type');

    // Apply date filters
    if (filters.startDate) {
      summaryQb.andWhere('ledger_entry.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      summaryQb.andWhere('ledger_entry.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Apply account types filter
    if (filters.accountTypes && filters.accountTypes.length > 0) {
      summaryQb.andWhere('ledger_entry.account_type IN (:...accountTypes)', {
        accountTypes: filters.accountTypes,
      });
    }

    const summaryResults = await summaryQb.getRawMany<{
      accountType: string;
      totalBalance: string;
      totalDebits: string;
      totalCredits: string;
      entriesCount: string;
    }>();

    // Step 2: For each account, get the limited entries with operation data
    const accountsData: AccountSummaryData[] = [];

    for (const summary of summaryResults) {
      const accountType = summary.accountType;

      // Get limited entries for this account type
      const entriesQb = this.repo
        .createQueryBuilder('ledger_entry')
        .leftJoin('ledger_entry.operation', 'operation')
        .select('ledger_entry.id', 'id')
        .addSelect('ledger_entry.operation_id', 'operationId')
        .addSelect('ledger_entry.account_type', 'accountType')
        .addSelect('ledger_entry.amount', 'amount')
        .addSelect('ledger_entry.created_at', 'createdAt')
        .addSelect('ledger_entry.description', 'description')
        .addSelect('ledger_entry.loan_id', 'loanId')
        .addSelect('ledger_entry.stock_id', 'stockId')
        .addSelect(
          'ledger_entry.mandatory_contribution_id',
          'mandatoryContributionId',
        )
        .addSelect('ledger_entry.stock_subscription_id', 'stockSubscriptionId')
        .addSelect('operation.type', 'operationType')
        .addSelect('operation.date', 'operationDate')
        .where('ledger_entry.account_type = :accountType', { accountType })
        .orderBy('ledger_entry.created_at', 'DESC')
        .limit(entriesLimit);

      // Apply same date filters
      if (filters.startDate) {
        entriesQb.andWhere('ledger_entry.created_at >= :startDate', {
          startDate: filters.startDate,
        });
      }

      if (filters.endDate) {
        entriesQb.andWhere('ledger_entry.created_at <= :endDate', {
          endDate: filters.endDate,
        });
      }

      const entries = await entriesQb.getRawMany<{
        id: string;
        operationId: string;
        accountType: string;
        amount: string;
        createdAt: Date;
        description: string | null;
        loanId: string | null;
        stockId: string | null;
        mandatoryContributionId: string | null;
        stockSubscriptionId: string | null;
        operationType: string | null;
        operationDate: Date | null;
      }>();

      accountsData.push({
        accountType: summary.accountType as AccountType,
        totalBalance: Number(summary.totalBalance || 0),
        totalDebits: Number(summary.totalDebits || 0),
        totalCredits: Number(summary.totalCredits || 0),
        entriesCount: Number(summary.entriesCount || 0),
        entries: entries.map((entry) => ({
          id: entry.id,
          operationId: entry.operationId,
          accountType: entry.accountType as AccountType,
          amount: Number(entry.amount),
          createdAt: entry.createdAt,
          description: entry.description,
          loanId: entry.loanId,
          stockId: entry.stockId,
          mandatoryContributionId: entry.mandatoryContributionId,
          stockSubscriptionId: entry.stockSubscriptionId,
          operationType: entry.operationType as string | undefined,
          operationDate: entry.operationDate || undefined,
        })),
      });
    }

    return accountsData;
  }
}
