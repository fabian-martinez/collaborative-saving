import { Injectable } from '@nestjs/common';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { PaymentProjectionService } from '@domain/services/payment-projection.service';
import { GetPaymentScheduleQueryDto } from '@application/dto/members/get-payment-schedule-query.dto';
import { PaymentScheduleResponseDto } from '@application/dto/members/payment-schedule-response.dto';
import { PaymentScheduleItemDto } from '@application/dto/members/payment-schedule-item.dto';
import { LedgerEntryGrouper } from '@domain/utils/ledger-entry-grouper';
import {
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Get Member Payment Schedule Query Handler
 *
 * Retrieves complete payment schedule for a member including historical and projected payments
 */
@Injectable()
export class GetMemberPaymentScheduleQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly paymentProjectionService: PaymentProjectionService,
  ) {}

  async execute(
    memberId: string,
    query: GetPaymentScheduleQueryDto,
  ): Promise<PaymentScheduleResponseDto> {
    // 1. Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // 2. Get active loans for the member
    const loans = await this.loanRepository.findActiveByMember(memberId);

    // 3. Get all loan transaction details for these loans
    const allTransactions: Array<{
      loanId: string;
      transactions: Awaited<
        ReturnType<LoanTransactionDetailRepository['findByLoan']>
      >;
    }> = [];
    for (const loan of loans) {
      const transactions =
        await this.loanTransactionDetailRepository.findByLoan(loan.id);
      allTransactions.push({ loanId: loan.id, transactions });
    }
    const flatTransactions = allTransactions.flatMap((t) => t.transactions);

    // 4. Get historical loan payments (operations of type LOAN_PAYMENT)
    const loanPaymentOperations = await this.operationRepository.findByMember(
      memberId,
      {
        types: [OperationType.LOAN_PAYMENT],
      },
    );

    // 5. Get ledger entries for loan payment operations
    const operationIds = loanPaymentOperations.map((op) => op.id);
    const allEntries =
      operationIds.length > 0
        ? await this.ledgerEntryRepository.findByOperations(operationIds)
        : [];

    // 6. Group entries by operation
    const entriesByOperation = LedgerEntryGrouper.groupByOperation(allEntries);

    // 7. Build historical payments from operations
    const historicalPayments: PaymentScheduleItemDto[] = [];
    for (const operation of loanPaymentOperations) {
      const entries = entriesByOperation.get(operation.id) || [];

      // Find interest and principal entries
      const interestEntry = entries.find(
        (e) => e.accountType === INTEREST_INCOME_ACCOUNT && e.loanId,
      );
      const principalEntry = entries.find(
        (e) => e.accountType === LOANS_RECEIVABLE_ACCOUNT && e.loanId,
      );

      if (!interestEntry && !principalEntry) {
        continue;
      }

      const loanId =
        interestEntry?.loanId || principalEntry?.loanId || undefined;
      const loan = loans.find((l) => l.id === loanId);

      const interestAmount = interestEntry ? Math.abs(interestEntry.amount) : 0;
      const principalAmount = principalEntry
        ? Math.abs(principalEntry.amount)
        : 0;

      historicalPayments.push({
        date: operation.date,
        type: 'historical',
        loanId,
        loanType: loan?.loanType,
        totalAmount: interestAmount + principalAmount,
        interestAmount,
        principalAmount,
        status: 'paid',
        operationId: operation.id,
      });
    }

    // Sort historical payments by date
    historicalPayments.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // 8. Project future payments
    const monthsToProject = query.months || 12;
    const startDate = new Date();
    const projections = this.paymentProjectionService.projectFuturePayments(
      loans,
      flatTransactions,
      startDate,
      monthsToProject,
    );

    // 9. Convert projections to DTOs
    const projectedPayments: PaymentScheduleItemDto[] = projections.map(
      (proj) => ({
        date: proj.date,
        type: 'projected',
        loanId: proj.loanId,
        loanType: proj.loanType,
        totalAmount: proj.totalAmount,
        interestAmount: proj.interestAmount,
        principalAmount: proj.principalAmount,
        status: 'pending' as const,
        remainingBalance: proj.remainingBalance,
        paymentNumber: proj.paymentNumber,
      }),
    );

    // 10. Calculate summary
    const totalPaid = historicalPayments.reduce(
      (sum, p) => sum + p.totalAmount,
      0,
    );
    const totalPending = projectedPayments.reduce(
      (sum, p) => sum + p.totalAmount,
      0,
    );
    const totalOutstandingBalance = loans.reduce(
      (sum, loan) => sum + loan.outstandingBalance,
      0,
    );

    const nextPayment = projectedPayments[0];
    const nextPaymentDate = nextPayment
      ? new Date(nextPayment.date)
      : undefined;
    const nextPaymentAmount = nextPayment?.totalAmount || 0;

    return {
      memberId,
      historicalPayments,
      projectedPayments,
      summary: {
        totalPaid,
        totalPending,
        nextPaymentDate,
        nextPaymentAmount,
        totalOutstandingBalance,
      },
    };
  }
}
