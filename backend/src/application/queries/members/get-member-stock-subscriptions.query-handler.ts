import { Injectable } from '@nestjs/common';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { StockSubscriptionResponseDto } from '@application/dto/members/stock-subscription-response.dto';

/**
 * Get Member Stock Subscriptions Query Handler
 *
 * Retrieves stock subscriptions for a member.
 * By default, only returns active subscriptions. Set includeInactive to true to include inactive ones.
 */
@Injectable()
export class GetMemberStockSubscriptionsQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly stockRepository: StockRepository,
  ) {}

  async execute(
    memberId: string,
    includeInactive?: boolean,
  ): Promise<StockSubscriptionResponseDto[]> {
    // Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // Get stock subscriptions for the member
    // If includeInactive is true, get all subscriptions; otherwise, only active ones
    const stockSubscriptions = includeInactive
      ? await this.stockSubscriptionRepository.findByMember(memberId)
      : await this.stockSubscriptionRepository.findActiveByMember(memberId);

    if (stockSubscriptions.length === 0) {
      return [];
    }

    // Get unique stock IDs
    const stockIds = [...new Set(stockSubscriptions.map((sub) => sub.stockId))];

    // Fetch stocks in parallel
    const stocks = await Promise.all(
      stockIds.map((id) => this.stockRepository.findById(id)),
    );

    // Create map for quick lookup
    const stockMap = new Map(
      stocks
        .filter((stock): stock is NonNullable<typeof stock> => stock !== null)
        .map((stock) => [stock.id, stock]),
    );

    // Map stock subscriptions to response DTOs
    const subscriptions: StockSubscriptionResponseDto[] = [];

    for (const subscription of stockSubscriptions) {
      const stock = stockMap.get(subscription.stockId);
      if (!stock) {
        // Skip if stock not found
        continue;
      }

      const subscriptionDto: StockSubscriptionResponseDto = {
        id: subscription.id,
        stockId: subscription.stockId,
        stockType: stock.type,
        quantity: subscription.quantity,
        purchaseDate: subscription.purchaseDate,
        status: subscription.status,
        financingLoanId: subscription.financingLoanId || null,
      };

      subscriptions.push(subscriptionDto);
    }

    // Sort by purchase date descending (most recent first)
    subscriptions.sort((a, b) => {
      const dateA = new Date(a.purchaseDate).getTime();
      const dateB = new Date(b.purchaseDate).getTime();
      return dateB - dateA;
    });

    return subscriptions;
  }
}
