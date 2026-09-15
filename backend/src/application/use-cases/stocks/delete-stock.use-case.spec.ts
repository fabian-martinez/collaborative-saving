/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { DeleteStockUseCase } from './delete-stock.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { Stock } from '@domain/entities/stock.entity';
import {
  StockSubscription,
  StockSubscriptionStatus,
} from '@domain/entities/stock-subscription.entity';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('DeleteStockUseCase', () => {
  let useCase: DeleteStockUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let softDeleteSpy: jest.SpyInstance;

  const mockStockId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    stockRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findGuaranteed: jest.fn(),
      softDelete: jest.fn(),
    };

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByMemberAndStock: jest.fn(),
      findAllByMemberAndStock: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findFreeOfFinancing: jest.fn(),
      findByMemberAndStockAndNoLoan: jest.fn(),
      findByFinancingLoan: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findByStock: jest.fn(),
      findByStocks: jest.fn(),
    };

    softDeleteSpy = jest.spyOn(stockRepository, 'softDelete');

    useCase = new DeleteStockUseCase(
      stockRepository,
      stockSubscriptionRepository,
    );
  });

  it('should throw StockNotFoundException if stock does not exist', async () => {
    stockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(mockStockId)).rejects.toThrow(
      StockNotFoundException,
    );
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });

  it('should throw InvalidRequestError if stock is already deleted', async () => {
    const stock = Stock.create({
      name: 'Acción Ordinaria',
      value: 100,
      monthlyContribution: 50,
    });
    stock.markAsDeleted();
    stockRepository.findById.mockResolvedValue(stock);

    await expect(useCase.execute(mockStockId)).rejects.toThrow(
      InvalidRequestError,
    );
    await expect(useCase.execute(mockStockId)).rejects.toThrow(
      `Stock with ID ${mockStockId} is already deleted`,
    );
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });

  it('should throw InvalidRequestError if stock has active subscriptions', async () => {
    const stock = Stock.create({
      name: 'Acción Ordinaria',
      value: 100,
      monthlyContribution: 50,
    });
    stockRepository.findById.mockResolvedValue(stock);

    const activeSubscription = StockSubscription.fromPersistence({
      id: 'sub-1',
      member_id: 'mem-1',
      stock_id: mockStockId,
      quantity: 5,
      status: StockSubscriptionStatus.ACTIVE,
      purchase_date: new Date(),
    });

    stockSubscriptionRepository.findByStock.mockResolvedValue([
      activeSubscription,
    ]);

    await expect(useCase.execute(mockStockId)).rejects.toThrow(
      InvalidRequestError,
    );
    await expect(useCase.execute(mockStockId)).rejects.toThrow(
      `Cannot delete stock 'Acción Ordinaria' because it has active subscriptions`,
    );
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });

  it('should delete stock successfully if it has no subscriptions', async () => {
    const stock = Stock.create({
      name: 'Acción Ordinaria',
      value: 100,
      monthlyContribution: 50,
    });
    stockRepository.findById.mockResolvedValue(stock);
    stockSubscriptionRepository.findByStock.mockResolvedValue([]);

    await useCase.execute(mockStockId);

    expect(softDeleteSpy).toHaveBeenCalledWith(mockStockId);
  });

  it('should delete stock successfully if all subscriptions are inactive or have 0 quantity', async () => {
    const stock = Stock.create({
      name: 'Acción Ordinaria',
      value: 100,
      monthlyContribution: 50,
    });
    stockRepository.findById.mockResolvedValue(stock);

    const inactiveSubscription = StockSubscription.fromPersistence({
      id: 'sub-1',
      member_id: 'mem-1',
      stock_id: mockStockId,
      quantity: 0,
      status: StockSubscriptionStatus.INACTIVE,
      purchase_date: new Date(),
    });

    stockSubscriptionRepository.findByStock.mockResolvedValue([
      inactiveSubscription,
    ]);

    await useCase.execute(mockStockId);

    expect(softDeleteSpy).toHaveBeenCalledWith(mockStockId);
  });
});
