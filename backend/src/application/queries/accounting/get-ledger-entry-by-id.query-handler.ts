import { Injectable } from '@nestjs/common';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LedgerEntryResponseDto } from '@application/dto/accounting/ledger-entry-response.dto';
import { LedgerEntryNotFoundException } from '@application/exceptions/ledger-entry-not-found.exception';

@Injectable()
export class GetLedgerEntryByIdQueryHandler {
  constructor(private readonly ledgerEntryRepository: LedgerEntryRepository) {}

  async execute(ledgerEntryId: string): Promise<LedgerEntryResponseDto> {
    const entry = await this.ledgerEntryRepository.findById(ledgerEntryId);
    if (!entry) {
      throw new LedgerEntryNotFoundException(ledgerEntryId);
    }

    return {
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
    };
  }
}
