import { CloseCdtDto } from '@application/dto/stocks/close-cdt.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class CloseCdtUseCase {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
  ) {}

  async execute(dto: CloseCdtDto): Promise<void> {
    const stock = await this.stockRepository.findById(dto.stockId);
    if (!stock) {
      throw new InvalidRequestError(`Stock with ID ${dto.stockId} not found`);
    }

    if (!stock.type.startsWith('CDT-')) {
      throw new InvalidRequestError('Stock is not a CDT');
    }

    if (stock.isDeleted()) {
      throw new InvalidRequestError('CDT is already closed/deleted');
    }

    // Find the associated subscription
    const subscriptions = await this.stockSubscriptionRepository.findByStock(
      stock.id,
    );
    const subscription = subscriptions.find((sub) => sub.isActive());

    if (!subscription) {
      throw new InvalidRequestError(
        'No active subscription found for this CDT',
      );
    }

    // Mark stock as deleted
    stock.markAsDeleted();
    await this.stockRepository.save(stock);

    // Mark subscription as inactive
    subscription.markAsInactive();
    await this.stockSubscriptionRepository.save(subscription);

    // Create pending payment if meetingId is provided
    if (dto.meetingId) {
      const pendingPayment = PendingMemberPayment.create({
        memberId: subscription.memberId,
        meetingId: dto.meetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: stock.value, // Return the initial value. Interest is usually paid as dividends or we could add them here if calculated.
        notes: `Retiro de CDT ${stock.type}`,
        stockId: stock.id,
        stockSubscriptionId: subscription.id,
      });

      await this.pendingMemberPaymentRepository.save(pendingPayment);
    }
  }
}
