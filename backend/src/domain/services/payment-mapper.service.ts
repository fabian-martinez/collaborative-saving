import { LedgerEntry } from '../entities/ledger-entry.entity';
import { PaymentFilterType } from '../enums/payment-filter-type.enum';
import { OperationType } from '../enums/operation-type.enum';
import { PaymentType } from '../enums/payment-type.enum';
import { CASH_ACCOUNT } from '../constants/account-types';

/**
 * Payment Mapper Service
 *
 * Domain service that contains business logic for payment calculations and type mappings.
 * This service encapsulates rules about:
 * - How to calculate payment totals from ledger entries
 * - How to map payment filter types to operation types
 * - How to map operation types to payment types for presentation
 */
export class PaymentMapperService {
  /**
   * Calculates the total payment amount from ledger entries.
   *
   * Business Rule: A payment total is the sum of positive amounts from CASH_ACCOUNT entries.
   * This represents the money that actually left the member's account.
   *
   * @param entries - Array of ledger entries to calculate from
   * @returns The total payment amount
   */
  calculatePaymentTotalAmount(entries: LedgerEntry[]): number {
    return entries
      .filter((e) => e.accountType === CASH_ACCOUNT && e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  /**
   * Maps a PaymentFilterType (UI filter) to corresponding OperationTypes.
   *
   * This defines which operation types are included when filtering by a payment filter type.
   *
   * @param filter - The payment filter type from the query
   * @returns Array of operation types that match the filter
   */
  mapPaymentFilterToOperationTypes(filter: PaymentFilterType): OperationType[] {
    switch (filter) {
      case PaymentFilterType.MONTHLY_PAYMENT:
        return [
          OperationType.MONTHLY_PAYMENT,
          OperationType.MANDATORY_CONTRIBUTION,
          OperationType.STOCK_FEE,
          OperationType.LOAN_PAYMENT,
          OperationType.FEE,
          OperationType.INSURANCE_PAYMENT,
        ];
      case PaymentFilterType.STOCK_PURCHASE:
        return [OperationType.STOCK_PURCHASE];
      case PaymentFilterType.STOCK_MODIFICATION:
        return [OperationType.STOCK_MODIFICATION];
      case PaymentFilterType.LOAN_EXTRAORDINARY_PAYMENT:
        // For now, we can filter LOAN_PAYMENT operations that are not part of MONTHLY_PAYMENT
        // This might need refinement based on business logic
        return [OperationType.LOAN_PAYMENT];
      default:
        return [];
    }
  }

  /**
   * Maps an OperationType to a PaymentType for presentation purposes.
   *
   * This defines how internal operation types are presented to users as payment types.
   *
   * @param operationType - The operation type from the domain
   * @returns The corresponding payment type for presentation
   */
  mapOperationTypeToPaymentType(operationType: OperationType): PaymentType {
    switch (operationType) {
      case OperationType.MONTHLY_PAYMENT:
        // For MONTHLY_PAYMENT, we need to infer from entries
        // For now, return a default, but this could be enhanced
        return PaymentType.MANDATORY_CONTRIBUTION;
      case OperationType.MANDATORY_CONTRIBUTION:
        return PaymentType.MANDATORY_CONTRIBUTION;
      case OperationType.STOCK_FEE:
        return PaymentType.STOCK_FEE;
      case OperationType.LOAN_PAYMENT:
        return PaymentType.LOAN_PAYMENT;
      case OperationType.FEE:
        return PaymentType.FEE;
      case OperationType.INSURANCE_PAYMENT:
        return PaymentType.INSURANCE;
      case OperationType.STOCK_PURCHASE:
        return PaymentType.STOCK_PURCHASE;
      case OperationType.STOCK_MODIFICATION:
        return PaymentType.STOCK_MODIFICATION;
      default:
        return PaymentType.FEE;
    }
  }
}
