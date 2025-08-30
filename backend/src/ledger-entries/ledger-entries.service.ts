import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { FindLedgerEntriesDto } from './dto/find-ledger-entries.dto';
import { LedgerEntryEnrichedDto } from './dto/ledger-entry-enriched.dto';

// Tipos para los resultados de consultas SQL
type LedgerEntryRawResult = {
  id: string;
  operation_id: string;
  account_type: string;
  amount: string;
  description: string;
  created_at: string;
  type: string;
  date: string;
  member_id: string;
  memberName: string;
  meeting_id: string;
  meetingDate: string;
  loan_id: string | null;
  stock_id: string | null;
  mandatory_contribution_id: string | null;
  stock_subscription_id: string | null;
};

type LedgerEntryDetailedRawResult = {
  le_id: string;
  le_operation_id: string;
  le_account_type: string;
  le_amount: string | null;
  le_description: string | null;
  le_created_at: string;
  le_loan_id: string | null;
  le_stock_id: string | null;
  le_mandatory_contribution_id: string | null;
  le_stock_subscription_id: string | null;
  operation_type: string;
  operation_description: string | null;
  operation_date: string;
  operation_member_id: string;
  operation_meeting_id: string;
  member_name: string;
  meeting_date: string;
};

@Injectable()
export class LedgerEntriesService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(params: FindLedgerEntriesDto): Promise<{
    data: LedgerEntryEnrichedDto[];
    page: number;
    limit: number;
    total: number;
  }> {
    const qb = this.dataSource
      .createQueryBuilder(LedgerEntry, 'le')
      .leftJoin('le.operation', 'operation')
      .leftJoin('operation.member', 'member')
      .leftJoin('operation.meeting', 'meeting')
      .select([
        'le.id',
        'le.operation_id',
        'le.account_type',
        'le.amount',
        'le.description',
        'le.created_at',
        'le.loan_id',
        'le.stock_id',
        'le.mandatory_contribution_id',
        'le.stock_subscription_id',
        'operation.type',
        'operation.description',
        'operation.date',
        'operation.member_id',
        'operation.meeting_id',
        'member.name',
        'meeting.date',
      ])
      .addSelect('member.name', 'memberName')
      .addSelect('meeting.date', 'meetingDate');

    // Aplicar filtros
    if (params.q) {
      const searchTerm = `%${params.q}%`;
      qb.andWhere(
        '(le.description ILIKE :searchTerm OR operation.description ILIKE :searchTerm OR operation.id::text ILIKE :searchTerm)',
        { searchTerm },
      );
    }

    if (params.memberId) {
      qb.andWhere('operation.member_id = :memberId', {
        memberId: params.memberId,
      });
    }

    if (params.accountType) {
      qb.andWhere('le.account_type = :accountType', {
        accountType: params.accountType,
      });
    }

    if (params.meetingId) {
      qb.andWhere('operation.meeting_id = :meetingId', {
        meetingId: params.meetingId,
      });
    }

    if (params.dateFrom) {
      qb.andWhere('le.created_at >= :dateFrom', { dateFrom: params.dateFrom });
    }

    if (params.dateTo) {
      qb.andWhere('le.created_at <= :dateTo', { dateTo: params.dateTo });
    }

    // Paginación
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100); // Máximo 100 por página
    const offset = (page - 1) * limit;

    qb.skip(offset).take(limit);
    qb.orderBy('le.created_at', 'DESC');

    const data = await qb.getRawMany();
    const total = data.length;

    // Transformar a DTO enriquecido
    const enrichedData: LedgerEntryEnrichedDto[] = data.map(
      (row: LedgerEntryRawResult) => ({
        id: row.id,
        operationId: row.operation_id,
        accountType: row.account_type,
        amount: parseFloat(row.amount),
        description: row.description,
        createdAt: new Date(row.created_at),
        operationType: row.type,
        operationDescription: row.description,
        operationDate: new Date(row.date),
        memberId: row.member_id,
        memberName: row.memberName,
        meetingId: row.meeting_id,
        meetingDate: new Date(row.meetingDate),
        loanId: row.loan_id || undefined,
        stockId: row.stock_id || undefined,
        mandatoryContributionId: row.mandatory_contribution_id || undefined,
        stockSubscriptionId: row.stock_subscription_id || undefined,
      }),
    );

    return {
      data: enrichedData,
      page,
      limit,
      total,
    };
  }

  async findByOperationId(
    operationId: string,
  ): Promise<LedgerEntryEnrichedDto[]> {
    const qb = this.dataSource
      .createQueryBuilder(LedgerEntry, 'le')
      .leftJoin('le.operation', 'operation')
      .leftJoin('operation.member', 'member')
      .leftJoin('operation.meeting', 'meeting')
      .select([
        'le.id as le_id',
        'le.operation_id as le_operation_id',
        'le.account_type as le_account_type',
        'le.amount as le_amount',
        'le.description as le_description',
        'le.created_at as le_created_at',
        'le.loan_id as le_loan_id',
        'le.stock_id as le_stock_id',
        'le.mandatory_contribution_id as le_mandatory_contribution_id',
        'le.stock_subscription_id as le_stock_subscription_id',
        'operation.type as operation_type',
        'operation.description as operation_description',
        'operation.date as operation_date',
        'operation.member_id as operation_member_id',
        'operation.meeting_id as operation_meeting_id',
        'member.name as member_name',
        'meeting.date as meeting_date',
      ])
      .where('le.operation_id = :operationId', { operationId })
      .orderBy('le.created_at', 'ASC');

    const data = await qb.getRawMany();

    if (data.length === 0) {
      throw new NotFoundException(
        `No ledger entries found for operation with ID "${operationId}"`,
      );
    }

    // Transformar a DTO enriquecido
    return data.map((row: LedgerEntryDetailedRawResult) => ({
      id: row.le_id,
      operationId: row.le_operation_id,
      accountType: row.le_account_type,
      amount: row.le_amount ? parseFloat(String(row.le_amount)) : 0,
      description: row.le_description || '',
      createdAt: new Date(row.le_created_at),
      operationType: row.operation_type,
      operationDescription: row.operation_description || '',
      operationDate: new Date(row.operation_date),
      memberId: row.operation_member_id,
      memberName: row.member_name,
      meetingId: row.operation_meeting_id,
      meetingDate: new Date(row.meeting_date),
      loanId: row.le_loan_id || undefined,
      stockId: row.le_stock_id || undefined,
      mandatoryContributionId: row.le_mandatory_contribution_id || undefined,
      stockSubscriptionId: row.le_stock_subscription_id || undefined,
    }));
  }

  async findOne(id: string): Promise<LedgerEntry> {
    const ledgerEntry = await this.dataSource.manager
      .getRepository(LedgerEntry)
      .findOne({
        where: { id },
        relations: ['operation', 'operation.member', 'operation.meeting'],
      });

    if (!ledgerEntry) {
      throw new NotFoundException(`Ledger entry with ID "${id}" not found.`);
    }

    return ledgerEntry;
  }
}
