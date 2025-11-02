import { LoanTransactionDetail as LoanTransactionDetailDomain } from '@domain/entities/loan-transaction-detail.entity';
import { LoanTransactionDetail as LoanTransactionDetailEntity } from '../entities/loan-transaction-detail.entity';

export class LoanTransactionDetailMapper {
  static toDomain(
    persistence: LoanTransactionDetailEntity,
  ): LoanTransactionDetailDomain {
    try {
      return LoanTransactionDetailDomain.fromPersistence({
        id: persistence.id,
        loan_id: persistence.loanId,
        transaction_type: persistence.transactionType,
        amount: persistence.amount,
        transaction_date: persistence.transactionDate,
        notes: persistence.notes ?? null,
        operation_id: persistence.operationId ?? null,
      });
    } catch (error) {
      throw new Error(
        `Failed to map LoanTransactionDetail to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(
    domain: LoanTransactionDetailDomain,
  ): Partial<LoanTransactionDetailEntity> {
    return {
      id: domain.id,
      loanId: domain.loanId,
      transactionType: domain.transactionType,
      amount: domain.amount,
      transactionDate: domain.transactionDate,
      notes: domain.notes ?? null,
      operationId: domain.operationId ?? null,
    };
  }
}
