import { GuaranteedGrowthHandler } from './guaranteed-growth.handler';
import { DistributionContext, DistributionResult } from './distribution-chain';
import { Stock } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';

describe('GuaranteedGrowthHandler', () => {
  let handler: GuaranteedGrowthHandler;

  beforeEach(() => {
    handler = new GuaranteedGrowthHandler();
  });

  it('should return 0 assigned when no guaranteed stocks', () => {
    // ARRANGE
    const available = 1000;
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 0,
      interestByStock: {},
      stocks: [
        Stock.create({
          type: 'regular',
          value: 100,
          monthlyContribution: 10,
          isGuaranteed: false,
        }),
      ],
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
    const guaranteedStock = Stock.create({
      type: 'guaranteed',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: true,
      guaranteedYield: 0.05,
    });
    const context: DistributionContext = {
      totalInterest: 0,
      totalStockContributions: 0,
      interestAvailableForDistribution: 0,
      totalRequiredGuaranteedGrowth: 50,
      interestByStock: {},
      stocks: [guaranteedStock],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: guaranteedStock.id,
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

  it('should assign interests proportionally to guaranteed stocks', () => {
    // ARRANGE
    const available = 1000;
    const guaranteedStock1 = Stock.create({
      type: 'guaranteed-1',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: true,
      guaranteedYield: 0.05, // 5%
    });
    const guaranteedStock2 = Stock.create({
      type: 'guaranteed-2',
      value: 200,
      monthlyContribution: 20,
      isGuaranteed: true,
      guaranteedYield: 0.03, // 3%
    });

    // Stock 1: 100 * 0.05 * 10 = 50 required
    // Stock 2: 200 * 0.03 * 5 = 30 required
    // Total required: 80
    // Available from agile/priority: 1000 (covers all)
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 80,
      interestByStock: {
        [guaranteedStock1.id]: 500,
        [guaranteedStock2.id]: 500,
      },
      stocks: [guaranteedStock1, guaranteedStock2],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: guaranteedStock1.id,
          quantity: 10,
        }),
        StockSubscription.create({
          memberId: 'member-2',
          stockId: guaranteedStock2.id,
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
    expect(result.assigned).toBe(80); // 50 + 30
    expect(result.remaining).toBe(920); // 1000 - 80
    expect(result.updatedResult.assigned[guaranteedStock1.id]).toBe(50);
    expect(result.updatedResult.assigned[guaranteedStock2.id]).toBe(30);
  });

  it('should use agile/priority interest as limit when less than required', () => {
    // ARRANGE
    const available = 1000;
    const guaranteedStock = Stock.create({
      type: 'guaranteed',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: true,
      guaranteedYield: 0.05, // 5%
    });

    // Required: 100 * 0.05 * 10 = 50
    // Available from agile/priority: 30 (less than required)
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 50,
      interestByStock: { [guaranteedStock.id]: 30 }, // Less than required
      stocks: [guaranteedStock],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: guaranteedStock.id,
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
    expect(result.assigned).toBe(30); // Limited by agile/priority interest
    expect(result.remaining).toBe(970);
    expect(result.updatedResult.assigned[guaranteedStock.id]).toBe(30);
  });

  it('should calculate required based on value * yield * shares', () => {
    // ARRANGE
    const available = 1000;
    const guaranteedStock = Stock.create({
      type: 'guaranteed',
      value: 150,
      monthlyContribution: 15,
      isGuaranteed: true,
      guaranteedYield: 0.04, // 4%
    });

    // Required: 150 * 0.04 * 20 = 120
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 120,
      interestByStock: { [guaranteedStock.id]: 200 }, // More than required
      stocks: [guaranteedStock],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: guaranteedStock.id,
          quantity: 20,
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
    expect(result.assigned).toBe(120); // Full required amount
    expect(result.remaining).toBe(880);
    expect(result.updatedResult.assigned[guaranteedStock.id]).toBe(120);
  });

  it('should handle multiple guaranteed stocks with proportional distribution when limited', () => {
    // ARRANGE
    const available = 1000;
    const guaranteedStock1 = Stock.create({
      type: 'guaranteed-1',
      value: 100,
      monthlyContribution: 10,
      isGuaranteed: true,
      guaranteedYield: 0.05, // 5%
    });
    const guaranteedStock2 = Stock.create({
      type: 'guaranteed-2',
      value: 200,
      monthlyContribution: 20,
      isGuaranteed: true,
      guaranteedYield: 0.03, // 3%
    });

    // Stock 1: 100 * 0.05 * 10 = 50 required
    // Stock 2: 200 * 0.03 * 5 = 30 required
    // Total required: 80
    // Available from agile/priority: 40 (less than required)
    // Stock 1 should get: (50/80) * 40 = 25
    // Stock 2 should get: (30/80) * 40 = 15
    const context: DistributionContext = {
      totalInterest: 1000,
      totalStockContributions: 5000,
      interestAvailableForDistribution: 1000,
      totalRequiredGuaranteedGrowth: 80,
      interestByStock: {
        [guaranteedStock1.id]: 25,
        [guaranteedStock2.id]: 15,
      }, // Less than required
      stocks: [guaranteedStock1, guaranteedStock2],
      subscriptions: [
        StockSubscription.create({
          memberId: 'member-1',
          stockId: guaranteedStock1.id,
          quantity: 10,
        }),
        StockSubscription.create({
          memberId: 'member-2',
          stockId: guaranteedStock2.id,
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
    expect(result.assigned).toBe(40); // Limited by agile/priority
    expect(result.remaining).toBe(960);
    expect(result.updatedResult.assigned[guaranteedStock1.id]).toBeCloseTo(25);
    expect(result.updatedResult.assigned[guaranteedStock2.id]).toBeCloseTo(15);
  });
});
