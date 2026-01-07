import { Injectable } from '@nestjs/common';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { OperationResponseDto } from '@application/dto/accounting/operation-response.dto';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';
import { OperationNotFoundException } from '@application/exceptions/operation-not-found.exception';

@Injectable()
export class GetOperationByIdQueryHandler {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(operationId: string): Promise<OperationResponseDto> {
    const operation = await this.operationRepository.findById(operationId);
    if (!operation) {
      throw new OperationNotFoundException(operationId);
    }

    // Get all ledger entries for this operation
    const entries =
      await this.ledgerEntryRepository.findByOperation(operationId);

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
  }
}
