import { Injectable } from '@nestjs/common';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { GetOperationsQueryDto } from '@application/dto/accounting/get-operations-query.dto';
import { OperationResponseDto } from '@application/dto/accounting/operation-response.dto';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';
import { PaginatedResponse } from '@application/dto/accounting/paginated-response.dto';
import { LedgerEntryGrouper } from '@domain/utils/ledger-entry-grouper';

@Injectable()
export class GetOperationsQueryHandler {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(
    query: GetOperationsQueryDto,
  ): Promise<PaginatedResponse<OperationResponseDto>> {
    const filters = {
      memberId: query.memberId,
      meetingId: query.meetingId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      type: query.type,
    };

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const result = await this.operationRepository.findWithPagination(
      filters,
      pagination,
      query.orderBy || 'DESC',
    );

    // Get all ledger entries for these operations
    const operationIds = result.data.map((op) => op.id);
    const allEntries =
      operationIds.length > 0
        ? await this.ledgerEntryRepository.findByOperations(operationIds)
        : [];

    // Group entries by operation
    const entriesByOperation = LedgerEntryGrouper.groupByOperation(allEntries);

    // Map operations to response DTOs with their entries
    const data: OperationResponseDto[] = result.data.map((operation) => {
      const entries = entriesByOperation.get(operation.id) || [];
      const entryDtos: LedgerEntryResponseDto[] = entries.map((entry) => ({
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

      return {
        id: operation.id,
        memberId: operation.memberId,
        meetingId: operation.meetingId,
        type: operation.type,
        date: operation.date,
        description: operation.description || null,
        entries: entryDtos,
      };
    });

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
