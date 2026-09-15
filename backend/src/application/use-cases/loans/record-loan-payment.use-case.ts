import { RecordLoanPaymentDto } from '@application/dto/loans/record-loan-payment.dto';
import { RecordLoanPaymentResponseDto } from '@application/dto/loans/record-loan-payment-response.dto';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import { LoanStatus } from '@domain/enums/loan-status.enum';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
} from '@domain/constants/account-types';
import { LOAN_CONSTANTS } from '@domain/constants/business-rules.constants';

/**
 * Record Loan Payment Use Case
 *
 * Orchestrates the recording of a payment on an existing loan.
 * Handles interest/principal calculation, loan state updates,
 * transaction detail creation, and accounting entries.
 *
 * This use case encapsulates all loan payment logic that was previously
 * scattered across multiple use cases (RecordMonthlyPayments, ProcessStockExchange, etc.)
 */
export class RecordLoanPaymentUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(
    dto: RecordLoanPaymentDto,
  ): Promise<RecordLoanPaymentResponseDto> {
    return this.transactionManager.execute(async () => {
      // 1. Validate and get loan
      const loan = await this.loanRepository.findById(dto.loanId);
      if (!loan) {
        throw new LoanNotFoundException(dto.loanId);
      }

      // 2. Validate and normalize payment amount
      let totalPaymentAmount = Number(dto.totalPaymentAmount.toFixed(2));
      if (totalPaymentAmount <= 0 && !dto.isFullPayoff) {
        throw new InvalidRequestError(
          'Payment amount must be greater than zero',
        );
      }

      // 3. Calculate interest and principal distribution
      let interestPaid: number;
      let principalPaid: number;

      if (dto.isFullPayoff) {
        // Full payoff requested: principal covers entire outstanding balance
        principalPaid = loan.outstandingBalance;
        if (dto.forcedInterestAmount !== undefined) {
          interestPaid = Number(dto.forcedInterestAmount.toFixed(2));
        } else {
          interestPaid = Number(loan.calculateInterestDue().toFixed(2));
        }
        totalPaymentAmount = Number((principalPaid + interestPaid).toFixed(2));
      } else if (
        dto.forcedInterestAmount !== undefined &&
        dto.forcedPrincipalAmount !== undefined
      ) {
        // Use forced amounts (for special cases like stock-based payments)
        interestPaid = Number(dto.forcedInterestAmount.toFixed(2));
        principalPaid = Number(dto.forcedPrincipalAmount.toFixed(2));

        // Validate forced amounts match total
        const forcedTotal = Number((interestPaid + principalPaid).toFixed(2));
        if (Math.abs(forcedTotal - totalPaymentAmount) > 0.01) {
          throw new InvalidRequestError(
            `Forced amounts (${forcedTotal}) do not match total payment (${totalPaymentAmount})`,
          );
        }
      } else if (dto.forcedPrincipalAmount !== undefined) {
        // Only principal forced (e.g., stock-based payment where all goes to principal)
        principalPaid = Number(dto.forcedPrincipalAmount.toFixed(2));
        interestPaid = Math.max(
          0,
          Number((totalPaymentAmount - principalPaid).toFixed(2)),
        );
      } else if (dto.forcedInterestAmount !== undefined) {
        // Only interest forced
        interestPaid = Number(dto.forcedInterestAmount.toFixed(2));
        principalPaid = Math.max(
          0,
          Number((totalPaymentAmount - interestPaid).toFixed(2)),
        );
      } else {
        // Calculate based on loan interest due (standard behavior)
        const interestDue = Number(loan.calculateInterestDue().toFixed(2));
        interestPaid = Number(
          Math.min(totalPaymentAmount, interestDue).toFixed(2),
        );
        principalPaid = Math.max(
          0,
          Number((totalPaymentAmount - interestPaid).toFixed(2)),
        );
      }

      // Auto-complete payoff if residual balance is within tolerance (<= PAYOFF_TOLERANCE_COP)
      // This closes the loan automatically without generating an additional accounting adjustment entry
      const residual = Number(
        (loan.outstandingBalance - principalPaid).toFixed(2),
      );
      if (residual > 0 && residual <= LOAN_CONSTANTS.PAYOFF_TOLERANCE_COP) {
        principalPaid = loan.outstandingBalance;
        totalPaymentAmount = Number((principalPaid + interestPaid).toFixed(2));
      }

      // 4. Validate principal doesn't exceed outstanding balance
      if (principalPaid > loan.outstandingBalance) {
        throw new InvalidRequestError(
          `Principal payment (${principalPaid}) exceeds outstanding balance (${loan.outstandingBalance})`,
        );
      }

      // 5. Update loan state using domain method (validates domain invariants before persistence)
      loan.recordPayment(principalPaid, interestPaid);

      // 6. Build ledger entries
      const ledgerEntries: RecordOperationDto['entries'] = [];

      // Cash entry (debit - money received)
      ledgerEntries.push({
        accountType: CASH_ACCOUNT,
        amount: totalPaymentAmount,
        description: this.buildCashDescription(
          principalPaid,
          interestPaid,
          dto.notes,
        ),
        loanId: dto.loanId,
      });

      // Interest income entry (credit - income) if interest was paid
      if (interestPaid > 0) {
        ledgerEntries.push({
          accountType: INTEREST_INCOME_ACCOUNT,
          amount: -interestPaid,
          description:
            dto.notes || `Intereses préstamo: ${interestPaid.toFixed(2)}`,
          loanId: dto.loanId,
        });
      }

      // Loans receivable entry (credit - reduce loan balance) for principal portion
      if (principalPaid > 0) {
        ledgerEntries.push({
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: -principalPaid,
          description:
            dto.notes || `Abono capital préstamo: ${principalPaid.toFixed(2)}`,
          loanId: dto.loanId,
        });
      }

      // 7. Record accounting operation
      const operationDto: RecordOperationDto = {
        memberId: loan.memberId,
        meetingId: dto.meetingId,
        type: OperationType.LOAN_PAYMENT,
        description:
          dto.notes ||
          this.buildOperationDescription(principalPaid, interestPaid),
        entries: ledgerEntries,
      };

      const operationResult =
        await this.recordOperationUseCase.execute(operationDto);

      // 8. Persist updated loan
      await this.loanRepository.save(loan);

      // 8.5. If loan is fully paid, release subscriptions
      if (
        loan.outstandingBalance === 0 &&
        loan.status === (LoanStatus.PAID as string)
      ) {
        await this.releaseSubscriptionsForPaidLoan(loan.id);
      }

      // 8. Create loan transaction details
      const transactionDetailIds: string[] = [];

      if (interestPaid > 0) {
        const interestTransactionDetail = LoanTransactionDetail.create({
          loanId: loan.id,
          transactionType: LoanTransactionType.INTEREST_PAYMENT,
          amount: interestPaid,
          notes: dto.notes || null,
          operationId: operationResult.operationId,
        });
        const savedInterestDetail =
          await this.loanTransactionDetailRepository.save(
            interestTransactionDetail,
          );
        transactionDetailIds.push(savedInterestDetail.id);
      }

      if (principalPaid > 0) {
        const principalTransactionDetail = LoanTransactionDetail.create({
          loanId: loan.id,
          transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
          amount: principalPaid,
          notes: dto.notes || null,
          operationId: operationResult.operationId,
        });
        const savedPrincipalDetail =
          await this.loanTransactionDetailRepository.save(
            principalTransactionDetail,
          );
        transactionDetailIds.push(savedPrincipalDetail.id);
      }

      // 9. Return response
      return {
        loanId: loan.id,
        operationId: operationResult.operationId,
        interestPaid,
        principalPaid,
        newOutstandingBalance: loan.outstandingBalance,
        loanStatus: loan.status,
        transactionDetailIds,
      };
    });
  }

  private buildCashDescription(
    principalPaid: number,
    interestPaid: number,
    notes?: string,
  ): string {
    if (notes) {
      return notes;
    }
    if (interestPaid > 0 && principalPaid > 0) {
      return `Pago préstamo - Capital: ${principalPaid.toFixed(2)}, Intereses: ${interestPaid.toFixed(2)}`;
    } else if (principalPaid > 0) {
      return `Pago préstamo - Capital: ${principalPaid.toFixed(2)}`;
    } else {
      return `Pago préstamo - Intereses: ${interestPaid.toFixed(2)}`;
    }
  }

  private buildOperationDescription(
    principalPaid: number,
    interestPaid: number,
  ): string {
    if (interestPaid > 0 && principalPaid > 0) {
      return `Pago de préstamo - Capital: ${principalPaid.toFixed(2)}, Intereses: ${interestPaid.toFixed(2)}`;
    } else if (principalPaid > 0) {
      return `Pago de capital de préstamo: ${principalPaid.toFixed(2)}`;
    } else {
      return `Pago de intereses de préstamo: ${interestPaid.toFixed(2)}`;
    }
  }

  /**
   * Releases subscriptions associated with a fully paid loan and consolidates them
   * with existing subscriptions without loan of the same stock type.
   */
  private async releaseSubscriptionsForPaidLoan(loanId: string): Promise<void> {
    // Get all subscriptions associated with the loan
    const subscriptions =
      await this.stockSubscriptionRepository.findByFinancingLoan(loanId);

    if (subscriptions.length === 0) {
      return;
    }

    // All subscriptions for a single loan belong to the same member
    const memberId = subscriptions[0].memberId;

    // Bolt ⚡: Prevent N+1 queries by fetching all free subscriptions for the member at once
    const freeSubscriptions =
      await this.stockSubscriptionRepository.findFreeOfFinancing(memberId);

    // Map of stockId -> free subscription
    const freeSubscriptionMap = new Map(
      freeSubscriptions.map((sub) => [sub.stockId, sub]),
    );

    const subscriptionsToSave: typeof subscriptions = [];

    for (const subscription of subscriptions) {
      // Release the loan
      subscription.update({ financingLoanId: null });

      // Look for existing subscription without loan of the same type in our map
      const freeSubscription = freeSubscriptionMap.get(subscription.stockId);

      if (freeSubscription && freeSubscription.id !== subscription.id) {
        // Consolidate: add quantity to existing subscription
        freeSubscription.update({
          quantity: freeSubscription.quantity + subscription.quantity,
        });

        // Add to save list if not already there
        if (!subscriptionsToSave.includes(freeSubscription)) {
          subscriptionsToSave.push(freeSubscription);
        }

        // Mark released subscription as inactive
        subscription.markAsInactive();
      } else if (!freeSubscription) {
        // If there wasn't a free subscription before, this newly released one
        // becomes the free subscription for this stock type
        freeSubscriptionMap.set(subscription.stockId, subscription);
      }

      subscriptionsToSave.push(subscription);
    }

    // Save all updated subscriptions in a single batch
    if (subscriptionsToSave.length > 0) {
      await this.stockSubscriptionRepository.saveMany(subscriptionsToSave);
    }
  }
}
