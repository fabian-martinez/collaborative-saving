import { ProportionalGrowthHandler } from './proportional-growth.handler';
import { DistributionContext, DistributionResult } from './distribution-chain';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';

describe('ProportionalGrowthHandler', () => {
  let handler: ProportionalGrowthHandler;

  beforeEach(() => {
    handler = new ProportionalGrowthHandler();
  });

  it('should return 0 assigned when no regular stocks', () => {
    // ARRANGE
    const available = 1000;
    const guaranteedStock = Stock.create({
      type: 'guaranteed',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: true,
      guaranteedYield: 0.05,
    });
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 50,
      agilePriorityInterest: 500,
      stocks: [guaranteedStock],
      subscriptions: [],
      ledgerEntries: [],
    };
    const partialResult: DistributionResult = {
      assigned: {},
      remaining: 1000,
    };

    // ACT
    const result = handler.handle(available, context, partialResult);

    // ASSERT
    expect(result.assigned).toBe(0);
    expect(result.remaining).toBe(available);
    expect(result.updatedResult.assigned).toEqual({});
  });

  it('should return 0 assigned when available is 0', () => {
    // ARRANGE
    const available = 0;
    const regularStock = Stock.create({
      type: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });
    const context: DistributionContext = {
      totalInterest: 0,
      totalStockContributions: 0,
      interestAvailableForDistribution: 0,
      totalRequiredGuaranteedGrowth: 0,
      agilePriorityInterest: 0,
      stocks: [regularStock],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: regularStock.id,
          quantity: 10,
        }),
      ],
      ledgerEntries: [],
    };
    const partialResult: DistributionResult = {
      assigned: {},
      remaining: 0,
    };

    // ACT
    const result = handler.handle(available, context, partialResult);

    // ASSERT
    expect(result.assigned).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it('should assign proportionally based on base value (value * shares)', () => {
    // ARRANGE
    const available = 1000;
    const regularStock1 = Stock.create({
      type: 'regular-1',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });
    const regularStock2 = Stock.create({
      type: 'regular-2',
      value: 200,
      monthlyContribution: 20,
      isGuaranteed: false,
    });

    // Stock 1: 100 * 10 = 1000 base value
    // Stock 2: 200 * 5 = 1000 base value
    // Total: 2000
    // Stock 1 should get: (1000/2000) * 1000 = 500
    // Stock 2 should get: (1000/2000) * 1000 = 500
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 0,
      agilePriorityInterest: 0,
      stocks: [regularStock1, regularStock2],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: regularStock1.id,
          quantity: 10,
        }),
        StockSubscription.create({
          memberId: 'member-2',
          stockId: regularStock2.id,
          quantity: 5,
        }),
      ],
      ledgerEntries: [],
    };
    const partialResult: DistributionResult = {
      assigned: {},
      remaining: 1000,
    };

    // ACT
    const result = handler.handle(available, context, partialResult);

    // ASSERT
    expect(result.assigned).toBe(1000);
    expect(result.remaining).toBe(0);
    expect(result.updatedResult.assigned[regularStock1.id]).toBe(500);
    expect(result.updatedResult.assigned[regularStock2.id]).toBe(500);
  });

  it('should include all non-guaranteed stocks', () => {
    // ARRANGE
    const available = 1000;
    const guaranteedStock = Stock.create({
      type: 'guaranteed',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: true,
      guaranteedYield: 0.05,
    });
    const regularStock1 = Stock.create({
      type: 'regular-1',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });
    const regularStock2 = Stock.create({
      type: 'regular-2',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
      behavior: StockBehavior.DIVIDEND_YIELD,
    });

    // Only regular stocks should be included
    // Stock 1: 100 * 10 = 1000
    // Stock 2: 100 * 10 = 1000
    // Total: 2000
    // Each should get 500
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 50,
      agilePriorityInterest: 50,
      stocks: [guaranteedStock, regularStock1, regularStock2],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: regularStock1.id,
          quantity: 10,
        }),
        StockSubscription.create({
          memberId: 'member-2',
          stockId: regularStock2.id,
          quantity: 10,
        }),
      ],
      ledgerEntries: [],
    };
    const partialResult: DistributionResult = {
      assigned: {},
      remaining: 1000,
    };

    // ACT
    const result = handler.handle(available, context, partialResult);

    // ASSERT
    expect(result.assigned).toBe(1000);
    expect(result.remaining).toBe(0);
    expect(result.updatedResult.assigned[guaranteedStock.id]).toBeUndefined();
    expect(result.updatedResult.assigned[regularStock1.id]).toBe(500);
    expect(result.updatedResult.assigned[regularStock2.id]).toBe(500);
  });

  it('should handle stocks with zero total shares', () => {
    // ARRANGE
    const available = 1000;
    const regularStock1 = Stock.create({
      type: 'regular-1',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });
    const regularStock2 = Stock.create({
      type: 'regular-2',
      value: 200,
      monthlyContribution: 20,
      isGuaranteed: false,
    });

    // Stock 1: 100 * 10 = 1000
    // Stock 2: 200 * 0 = 0 (no shares)
    // Total: 1000
    // Stock 1 should get all 1000
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 0,
      agilePriorityInterest: 0,
      stocks: [regularStock1, regularStock2],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: regularStock1.id,
          quantity: 10,
        }),
        // Stock 2 has no subscriptions
      ],
      ledgerEntries: [],
    };
    const partialResult: DistributionResult = {
      assigned: {},
      remaining: 1000,
    };

    // ACT
    const result = handler.handle(available, context, partialResult);

    // ASSERT
    expect(result.assigned).toBe(1000);
    expect(result.remaining).toBe(0);
    expect(result.updatedResult.assigned[regularStock1.id]).toBe(1000);
    expect(result.updatedResult.assigned[regularStock2.id]).toBeUndefined();
  });

  it('should update partial result correctly', () => {
    // ARRANGE
    const available = 500;
    const regularStock = Stock.create({
      type: 'regular',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: false,
    });

    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 0,
      agilePriorityInterest: 0,
      stocks: [regularStock],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: regularStock.id,
          quantity: 10,
        }),
      ],
      ledgerEntries: [],
    };
    const partialResult: DistributionResult = {
      assigned: {
        'previous-stock': 200,
      },
      remaining: 500,
    };

    // ACT
    const result = handler.handle(available, context, partialResult);

    // ASSERT
    expect(result.updatedResult.assigned['previous-stock']).toBe(200);
    expect(result.updatedResult.assigned[regularStock.id]).toBe(500);
  });
});
