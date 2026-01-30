import { Injectable } from '@nestjs/common';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { StockSubscriptionNotFoundException } from '@application/exceptions/stock-subscription-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { StockSubscriptionResponseDto } from '@application/dto/members/stock-subscription-response.dto';

/**
 * Get Stock Subscription By ID Query Handler
 *
 * Retrieves a specific stock subscription by ID for a member.
 * Includes inactive subscriptions. Validates that the subscription belongs to the member.
 */
@Injectable()
export class GetStockSubscriptionByIdQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly stockRepository: StockRepository,
  ) {}

  async execute(
    memberId: string,
    subscriptionId: string,
  ): Promise<StockSubscriptionResponseDto> {
    // Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // Get stock subscription by ID (includes inactive)
    const subscription =
      await this.stockSubscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new StockSubscriptionNotFoundException(subscriptionId);
    }

    // Validate that the subscription belongs to the member
    if (subscription.memberId !== memberId) {
      throw new StockSubscriptionNotFoundException(subscriptionId);
    }

    // Get the associated stock
    const stock = await this.stockRepository.findById(subscription.stockId);
    if (!stock) {
      throw new StockNotFoundException(subscription.stockId);
    }

    // Map to response DTO
    const subscriptionDto: StockSubscriptionResponseDto = {
      id: subscription.id,
      stockId: subscription.stockId,
      stockType: stock.name,
      quantity: subscription.quantity,
      purchaseDate: subscription.purchaseDate,
      status: subscription.status,
      financingLoanId: subscription.financingLoanId || null,
    };

    return subscriptionDto;
  }
}
