import { Injectable } from '@nestjs/common';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { GetLedgerEntriesQueryDto } from '@application/dto/accounting/get-ledger-entries-query.dto';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';
import { PaginatedResponse } from '@application/dto/accounting/paginated-response.dto';

@Injectable()
export class GetLedgerEntriesQueryHandler {
  constructor(
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(
    query: GetLedgerEntriesQueryDto,
  ): Promise<PaginatedResponse<LedgerEntryResponseDto>> {
    const filters = {
      memberId: query.memberId,
      accountType: query.accountType,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const result = await this.ledgerEntryRepository.findWithPagination(
      filters,
      pagination,
      query.orderBy || 'DESC',
    );

    const data: LedgerEntryResponseDto[] = result.data.map((entry) => ({
      id: entry.id,
      operationId: entry.operationId,
      accountType: entry.accountType,
      amount: entry.amount,
      createdAt: entry.createdAt,
      description: entry.description || null,
      loanId: entry.loanId || null,
      stockId: entry.stockId || null,
      mandatoryContributionId: entry.mandatoryContributionId || null,
      stockSubscriptionId: entry.stockSubscriptionId || null,
    }));

    const totalPages = Math.ceil(result.total / pagination.limit);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages,
      },
    };
  }
}

