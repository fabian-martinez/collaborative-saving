import { Injectable } from '@nestjs/common';
import { OperationType } from '@domain/enums/operation-type.enum';
import { GetMemberPurchasesQueryDto } from '@application/dto/members/get-member-purchases-query.dto';
import { MemberPurchaseResponseDto } from '@application/dto/members/member-purchase-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { STOCK_CAPITAL_ACCOUNT } from '@domain/constants/account-types';

/**
 * Get Member Purchases Query Handler
 *
 * Retrieves stock purchases made by a member, with optional filtering by meeting.
 */
@Injectable()
export class GetMemberPurchasesQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly stockRepository: StockRepository,
    private readonly loanRepository: LoanRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(
    memberId: string,
    query: GetMemberPurchasesQueryDto,
  ): Promise<MemberPurchaseResponseDto[]> {
    // Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // Get stock subscriptions for the member
    const stockSubscriptions =
      await this.stockSubscriptionRepository.findByMember(memberId);

    if (stockSubscriptions.length === 0) {
      return [];
    }

    // Get STOCK_PURCHASE operations for the member
    const operations = await this.operationRepository.findByMember(memberId, {
      meetingId: query.meetingId,
      types: [OperationType.STOCK_PURCHASE],
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

    // Create a map of stockSubscriptionId -> operation
    const operationByStockSubscriptionId = new Map<
      string,
      (typeof operations)[0]
    >();
    for (const entry of allEntries) {
      const subscriptionId = entry.stockSubscriptionId;
      if (subscriptionId) {
        const operation = operations.find((op) => op.id === entry.operationId);
        if (operation && !operationByStockSubscriptionId.has(subscriptionId)) {
          operationByStockSubscriptionId.set(subscriptionId, operation);
        }
      }
    }

    // Get unique stock IDs and loan IDs
    const stockIds = [...new Set(stockSubscriptions.map((sub) => sub.stockId))];
    const loanIds = stockSubscriptions
      .map((sub) => sub.financingLoanId)
      .filter((id): id is string => id !== null && id !== undefined);

    // Fetch stocks and loans in parallel
    const stocks = await Promise.all(
      stockIds.map((id) => this.stockRepository.findById(id)),
    );
    const loans =
      loanIds.length > 0 ? await this.loanRepository.findByIds(loanIds) : [];

    // Create maps for quick lookup
    const stockMap = new Map(
      stocks
        .filter((stock): stock is NonNullable<typeof stock> => stock !== null)
        .map((stock) => [stock.id, stock]),
    );
    const loanMap = new Map(loans.map((loan) => [loan.id, loan]));

    // Map stock subscriptions to purchase response DTOs
    const purchases: MemberPurchaseResponseDto[] = [];

    for (const subscription of stockSubscriptions) {
      const operation = operationByStockSubscriptionId.get(subscription.id);
      if (!operation) {
        // Skip subscriptions without a corresponding operation
        continue;
      }

      // Apply meeting filter if provided
      if (query.meetingId && operation.meetingId !== query.meetingId) {
        continue;
      }

      const stock = stockMap.get(subscription.stockId);
      if (!stock) {
        // Skip if stock not found
        continue;
      }

      // Find ledger entry with stockSubscriptionId to get totalValue
      const stockCapitalEntry = allEntries.find(
        (entry) =>
          entry.stockSubscriptionId === subscription.id &&
          entry.accountType === STOCK_CAPITAL_ACCOUNT,
      );

      const totalValue = stockCapitalEntry
        ? Math.abs(Number(stockCapitalEntry.amount))
        : stock.value * subscription.quantity;

      const unitValue =
        subscription.quantity > 0
          ? totalValue / subscription.quantity
          : stock.value;

      const purchase: MemberPurchaseResponseDto = {
        stockSubscriptionId: subscription.id,
        stockId: subscription.stockId,
        stockType: stock.type,
        quantity: subscription.quantity,
        unitValue,
        totalValue,
        purchaseDate: subscription.purchaseDate,
        meetingId: operation.meetingId,
        operationId: operation.id,
        loan: subscription.financingLoanId
          ? (() => {
              const loan = loanMap.get(subscription.financingLoanId);
              if (!loan) {
                return null;
              }
              return {
                loanId: loan.id,
                approvedAmount: loan.approvedAmount,
                interestRate: loan.interestRate,
                status: loan.status,
              };
            })()
          : null,
      };

      purchases.push(purchase);
    }

    // Sort by purchase date descending
    purchases.sort((a, b) => {
      const dateA = new Date(a.purchaseDate).getTime();
      const dateB = new Date(b.purchaseDate).getTime();
      return dateB - dateA;
    });

    return purchases;
  }
}
