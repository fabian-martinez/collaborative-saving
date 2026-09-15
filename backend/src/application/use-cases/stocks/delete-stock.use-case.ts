/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

export class DeleteStockUseCase {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
  ) {}

  async execute(stockId: string): Promise<void> {
    const stock = await this.stockRepository.findById(stockId);

    if (!stock) {
      throw new StockNotFoundException(stockId);
    }

    if (stock.isDeleted()) {
      throw new InvalidRequestError(
        `Stock with ID ${stockId} is already deleted`,
      );
    }

    // Validación de negocio: no eliminar si tiene suscripciones activas
    const subscriptions =
      await this.stockSubscriptionRepository.findByStock(stockId);
    const hasActiveSubscriptions = subscriptions.some(
      (sub) => sub.isActive() && sub.quantity > 0,
    );

    if (hasActiveSubscriptions) {
      throw new InvalidRequestError(
        `Cannot delete stock '${stock.name}' because it has active subscriptions`,
      );
    }

    if (this.stockRepository.softDelete) {
      await this.stockRepository.softDelete(stockId);
    } else {
      stock.markAsDeleted();
      await this.stockRepository.save(stock);
    }
  }
}
