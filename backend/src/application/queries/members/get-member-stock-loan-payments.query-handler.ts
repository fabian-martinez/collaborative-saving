import { Injectable } from '@nestjs/common';
import { OperationType } from '@domain/enums/operation-type.enum';
import { GetMemberStockModificationsQueryDto } from '@application/dto/members/get-member-stock-modifications-query.dto';
import { StockLoanPaymentResponseDto } from '@application/dto/members/stock-loan-payment-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import {
  STOCK_CAPITAL_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Get Member Stock Loan Payments Query Handler
 *
 * Retrieves stock loan payment operations made by a member, with optional filtering by meeting.
 */
@Injectable()
export class GetMemberStockLoanPaymentsQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(
    memberId: string,
    query: GetMemberStockModificationsQueryDto,
  ): Promise<StockLoanPaymentResponseDto[]> {
    // Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // Get STOCK_LOAN_PAYMENT operations for the member
    const operations = await this.operationRepository.findByMember(memberId, {
      meetingId: query.meetingId,
      types: [OperationType.STOCK_LOAN_PAYMENT],
    });

    if (operations.length === 0) {
      return [];
    }

    // Get all ledger entries for these operations
    const operationIds = operations.map((op) => op.id);
    const allEntries =
      operationIds.length > 0
        ? await this.ledgerEntryRepository.findByOperations(operationIds)
        : [];

    // Group entries by operation
    const entriesByOperation = new Map<string, typeof allEntries>();
    for (const entry of allEntries) {
      const opId = entry.operationId;
      if (!entriesByOperation.has(opId)) {
        entriesByOperation.set(opId, []);
      }
      entriesByOperation.get(opId)!.push(entry);
    }

    // Get all unique stock IDs, subscription IDs, and loan IDs from entries
    const stockIds = new Set<string>();
    const subscriptionIds = new Set<string>();
    const loanIds = new Set<string>();

    for (const entry of allEntries) {
      if (entry.stockId) stockIds.add(entry.stockId);
      if (entry.stockSubscriptionId)
        subscriptionIds.add(entry.stockSubscriptionId);
      if (entry.loanId) loanIds.add(entry.loanId);
    }

    // Fetch related entities
    const stocks = await Promise.all(
      Array.from(stockIds).map((id) => this.stockRepository.findById(id)),
    );
    const subscriptions = await Promise.all(
      Array.from(subscriptionIds).map((id) =>
        this.stockSubscriptionRepository.findById(id),
      ),
    );
    const loans =
      loanIds.size > 0
        ? await this.loanRepository.findByIds(Array.from(loanIds))
        : [];

    // Get loan transaction details for these operations
    // We need to get all transactions for the loans and filter by operationId
    const allLoanTransactions =
      loanIds.size > 0
        ? await Promise.all(
            Array.from(loanIds).map((loanId) =>
              this.loanTransactionDetailRepository.findByLoan(loanId),
            ),
          )
        : [];
    const loanTransactions = allLoanTransactions.flat();

    // Create maps for quick lookup
    const stockMap = new Map(
      stocks
        .filter((stock): stock is NonNullable<typeof stock> => stock !== null)
        .map((stock) => [stock.id, stock]),
    );
    const subscriptionMap = new Map(
      subscriptions
        .filter((sub): sub is NonNullable<typeof sub> => sub !== null)
        .map((sub) => [sub.id, sub]),
    );
    const loanMap = new Map(loans.map((loan) => [loan.id, loan]));

    // Map loan transactions by operation ID
    const transactionByOperationId = new Map<
      string,
      (typeof loanTransactions)[0]
    >();
    for (const transaction of loanTransactions) {
      if (transaction.operationId) {
        transactionByOperationId.set(transaction.operationId, transaction);
      }
    }

    // Build response DTOs
    const payments: StockLoanPaymentResponseDto[] = [];

    for (const operation of operations) {
      const entries = entriesByOperation.get(operation.id) || [];

      // Find stock capital entry (positive amount = debit = reduction)
      const stockEntry = entries.find(
        (e) => e.accountType === STOCK_CAPITAL_ACCOUNT && e.amount > 0,
      );

      // Find loan entry (negative amount = credit = reduction of loan)
      const loanEntry = entries.find(
        (e) => e.accountType === LOANS_RECEIVABLE_ACCOUNT && e.amount < 0,
      );

      if (!stockEntry || !loanEntry || !loanEntry.loanId) {
        continue;
      }

      const subscription = stockEntry.stockSubscriptionId
        ? subscriptionMap.get(stockEntry.stockSubscriptionId)
        : null;
      const loan = loanMap.get(loanEntry.loanId);

      if (!subscription || !loan) {
        continue;
      }

      const stock = stockMap.get(subscription.stockId);
      if (!stock) {
        continue;
      }

      // Get transaction detail
      const transactionDetail = transactionByOperationId.get(operation.id);

      // Calculate payment value
      const paymentValue = Math.abs(loanEntry.amount);
      const quantity = subscription.quantity || paymentValue / stock.value;

      // Calculate balances (we need to estimate previous balance)
      // Since we don't store the previous balance, we'll use the current loan balance
      // and add back the payment value to estimate the previous balance
      const newBalance = loan.outstandingBalance;
      const previousBalance = newBalance + paymentValue;

      const payment: StockLoanPaymentResponseDto = {
        operationId: operation.id,
        meetingId: operation.meetingId,
        date: operation.date,
        description: operation.description || '',
        stockId: stock.id,
        stockName: stock.name,
        quantity,
        paymentValue,
        loanId: loan.id,
        loanType: loan.loanType,
        previousBalance,
        newBalance,
        subscriptionId: subscription.id,
        transactionDetailId: transactionDetail?.id || '',
      };

      payments.push(payment);
    }

    // Sort by date descending
    payments.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return payments;
  }
}
