import { Injectable } from '@nestjs/common';
import { OperationType } from '@domain/enums/operation-type.enum';
import { GetMemberStockModificationsQueryDto } from '@application/dto/members/get-member-stock-modifications-query.dto';
import { StockExchangeResponseDto } from '@application/dto/members/stock-exchange-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import {
  STOCK_CAPITAL_ACCOUNT,
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Get Member Stock Exchanges Query Handler
 *
 * Retrieves stock exchange operations made by a member, with optional filtering by meeting.
 */
@Injectable()
export class GetMemberStockExchangesQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(
    memberId: string,
    query: GetMemberStockModificationsQueryDto,
  ): Promise<StockExchangeResponseDto[]> {
    // Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // Get STOCK_MODIFICATION operations for the member
    const operations = await this.operationRepository.findByMember(memberId, {
      meetingId: query.meetingId,
      types: [OperationType.STOCK_MODIFICATION],
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

    // Get all unique stock IDs and subscription IDs from entries
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

    // Get pending payments for these operations (by meeting)
    const pendingPayments = query.meetingId
      ? await this.pendingMemberPaymentRepository.findByMeeting(query.meetingId)
      : await this.pendingMemberPaymentRepository.findByMember(memberId);

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

    // Build response DTOs
    const exchanges: StockExchangeResponseDto[] = [];

    for (const operation of operations) {
      const entries = entriesByOperation.get(operation.id) || [];

      // Find stock capital entries to identify from/to subscriptions
      const stockCapitalEntries = entries.filter(
        (e) => e.accountType === STOCK_CAPITAL_ACCOUNT,
      );

      // Find from subscription (positive amount = debit = reduction)
      const fromEntry = stockCapitalEntries.find((e) => e.amount > 0);
      // Find to subscription (negative amount = credit = increase)
      const toEntry = stockCapitalEntries.find((e) => e.amount < 0);

      if (!fromEntry || !toEntry) {
        continue; // Skip if we can't identify from/to
      }

      const fromSubscription = fromEntry.stockSubscriptionId
        ? subscriptionMap.get(fromEntry.stockSubscriptionId)
        : null;
      const toSubscription = toEntry.stockSubscriptionId
        ? subscriptionMap.get(toEntry.stockSubscriptionId)
        : null;

      if (!fromSubscription || !toSubscription) {
        continue;
      }

      const fromStock = stockMap.get(fromSubscription.stockId);
      const toStock = stockMap.get(toSubscription.stockId);

      if (!fromStock || !toStock) {
        continue;
      }

      // Calculate values from ledger entries
      const fromValue = Math.abs(fromEntry.amount);
      const toValue = Math.abs(toEntry.amount);
      const difference = fromValue - toValue;

      // Find quantities from subscriptions or calculate from values
      const fromQuantity =
        fromSubscription.quantity || fromValue / fromStock.value;
      const toQuantity = toSubscription.quantity || toValue / toStock.value;

      // Check for pending payment (cash difference)
      // Pending payment is created with fromSubscriptionId (origin subscription)
      const cashEntry = entries.find((e) => e.accountType === CASH_ACCOUNT);
      const pendingPayment = cashEntry
        ? pendingPayments.find(
            (p) =>
              p.stockSubscriptionId === fromSubscription.id &&
              p.meetingId === operation.meetingId,
          )
        : null;

      // Check for loan (credit difference)
      const loanEntry = entries.find(
        (e) => e.accountType === LOANS_RECEIVABLE_ACCOUNT,
      );
      const loan = loanEntry?.loanId
        ? loanMap.get(loanEntry.loanId) || null
        : null;

      const exchange: StockExchangeResponseDto = {
        operationId: operation.id,
        meetingId: operation.meetingId,
        date: operation.date,
        description: operation.description || '',
        fromStockId: fromStock.id,
        fromStockType: fromStock.type,
        fromQuantity,
        fromValue,
        toStockId: toStock.id,
        toStockType: toStock.type,
        toQuantity,
        toValue,
        difference,
        differenceHandling: cashEntry
          ? 'cash'
          : loanEntry
            ? 'credit'
            : undefined,
        fromSubscriptionId: fromSubscription.id,
        toSubscriptionId: toSubscription.id,
        pendingPaymentId: pendingPayment?.id || null,
        loanId: loan?.id || null,
      };

      exchanges.push(exchange);
    }

    // Sort by date descending
    exchanges.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return exchanges;
  }
}
