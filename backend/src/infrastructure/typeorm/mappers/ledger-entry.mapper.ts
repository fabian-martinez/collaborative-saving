import { LedgerEntry as LedgerEntryDomain } from '@domain/entities/ledger-entry.entity';
import { LedgerEntry as LedgerEntryEntity } from '../entities/ledger-entry.entity';

export class LedgerEntryMapper {
  static toDomain(persistence: LedgerEntryEntity): LedgerEntryDomain {
    try {
      return LedgerEntryDomain.fromPersistence({
        id: persistence.id,
        operation_id: persistence.operationId,
        account_type: persistence.accountType,
        amount: persistence.amount,
        created_at: persistence.createdAt,
        description: persistence.description ?? null,
        loan_id: persistence.loanId ?? null,
        stock_id: persistence.stockId ?? null,
        mandatory_contribution_id: persistence.mandatoryContributionId ?? null,
        stock_subscription_id: persistence.stockSubscriptionId ?? null,
      });
    } catch (error) {
      throw new Error(
        `Failed to map LedgerEntry to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: LedgerEntryDomain): Partial<LedgerEntryEntity> {
    return {
      id: domain.id,
      operationId: domain.operationId,
      accountType: domain.accountType,
      amount: domain.amount,
      description: domain.description ?? null,
      loanId: domain.loanId ?? null,
      stockId: domain.stockId ?? null,
      mandatoryContributionId: domain.mandatoryContributionId ?? null,
      stockSubscriptionId: domain.stockSubscriptionId ?? null,
    };
  }
}
