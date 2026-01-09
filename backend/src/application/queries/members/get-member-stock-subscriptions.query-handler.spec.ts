import { GetMemberStockSubscriptionsQueryHandler } from './get-member-stock-subscriptions.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Member } from '@domain/entities/member.entity';
import {
  StockSubscription,
  StockSubscriptionStatus,
} from '@domain/entities/stock-subscription.entity';
import { Stock } from '@domain/entities/stock.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { StockBehavior } from '@domain/entities/stock.entity';

describe('GetMemberStockSubscriptionsQueryHandler', () => {
  let queryHandler: GetMemberStockSubscriptionsQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let stockRepository: jest.Mocked<StockRepository>;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByMemberAndStock: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findFreeOfFinancing: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findByStock: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    queryHandler = new GetMemberStockSubscriptionsQueryHandler(
      memberRepository,
      stockSubscriptionRepository,
      stockRepository,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const stockId = '770e8400-e29b-41d4-a716-446655440002';
    const stockId2 = '880e8400-e29b-41d4-a716-446655440003';

    it('should throw error when member not found', async () => {
      const findByIdSpy = jest
        .spyOn(memberRepository, 'findById')
        .mockResolvedValue(null);

      await expect(queryHandler.execute(memberId)).rejects.toThrow(
        MemberNotFoundException,
      );

      expect(findByIdSpy).toHaveBeenCalledWith(memberId);
    });

    it('should return empty array when no stock subscriptions found', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findActiveByMember')
        .mockResolvedValue([]);

      const result = await queryHandler.execute(memberId);

      expect(result).toEqual([]);
    });

    it('should return only active subscriptions when includeInactive is false or undefined', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        type: 'Acción A',
        value: 100000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const activeSubscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      const findActiveByMemberSpy = jest
        .spyOn(stockSubscriptionRepository, 'findActiveByMember')
        .mockResolvedValue([activeSubscription]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      // Test with undefined
      const result1 = await queryHandler.execute(memberId);
      expect(findActiveByMemberSpy).toHaveBeenCalledWith(memberId);
      expect(result1).toHaveLength(1);
      expect(result1[0].status).toBe(StockSubscriptionStatus.ACTIVE);

      // Test with false
      findActiveByMemberSpy.mockClear();
      const result2 = await queryHandler.execute(memberId, false);
      expect(findActiveByMemberSpy).toHaveBeenCalledWith(memberId);
      expect(result2).toHaveLength(1);
      expect(result2[0].status).toBe(StockSubscriptionStatus.ACTIVE);
    });

    it('should return active and inactive subscriptions when includeInactive is true', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        type: 'Acción A',
        value: 100000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const activeSubscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      const inactiveSubscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 0,
        purchaseDate: new Date('2024-01-10'),
      });
      inactiveSubscription.update({ status: StockSubscriptionStatus.INACTIVE });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      const findByMemberSpy = jest
        .spyOn(stockSubscriptionRepository, 'findByMember')
        .mockResolvedValue([activeSubscription, inactiveSubscription]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(memberId, true);

      expect(findByMemberSpy).toHaveBeenCalledWith(memberId);
      expect(result).toHaveLength(2);
      expect(
        result.find(
          (s) => s.status === (StockSubscriptionStatus.ACTIVE as string),
        ),
      ).toBeDefined();
      expect(
        result.find(
          (s) => s.status === (StockSubscriptionStatus.INACTIVE as string),
        ),
      ).toBeDefined();
    });

    it('should return subscriptions without loan successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        type: 'Acción A',
        value: 100000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const stockSubscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findActiveByMember')
        .mockResolvedValue([stockSubscription]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(memberId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: stockSubscription.id,
        stockId,
        stockType: stock.type,
        quantity: 2,
        purchaseDate: stockSubscription.purchaseDate,
        status: StockSubscriptionStatus.ACTIVE,
        financingLoanId: null,
      });
    });

    it('should return subscriptions with loan successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        type: 'Acción A',
        value: 100000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const loanId = '990e8400-e29b-41d4-a716-446655440004';
      const stockSubscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: loanId,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findActiveByMember')
        .mockResolvedValue([stockSubscription]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(memberId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: stockSubscription.id,
        stockId,
        stockType: stock.type,
        quantity: 2,
        purchaseDate: stockSubscription.purchaseDate,
        status: StockSubscriptionStatus.ACTIVE,
        financingLoanId: loanId,
      });
    });

    it('should return multiple subscriptions sorted by purchase date descending', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock1 = Stock.fromPersistence({
        id: stockId,
        type: 'Acción A',
        value: 100000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const stock2 = Stock.fromPersistence({
        id: stockId2,
        type: 'Acción B',
        value: 150000,
        monthly_contribution: 60000,
        is_guaranteed: false,
        guaranteed_yield: null,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const subscription1 = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      const subscription2 = StockSubscription.create({
        memberId,
        stockId: stockId2,
        quantity: 3,
        purchaseDate: new Date('2024-02-20'),
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findActiveByMember')
        .mockResolvedValue([subscription1, subscription2]);
      jest
        .spyOn(stockRepository, 'findById')
        .mockResolvedValueOnce(stock1)
        .mockResolvedValueOnce(stock2);

      const result = await queryHandler.execute(memberId);

      expect(result).toHaveLength(2);
      // Most recent first (subscription2 is from 2024-02-20)
      expect(result[0].id).toBe(subscription2.id);
      expect(result[1].id).toBe(subscription1.id);
      expect(result[0].stockType).toBe('Acción B');
      expect(result[1].stockType).toBe('Acción A');
    });

    it('should skip subscriptions when stock not found', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stockSubscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findActiveByMember')
        .mockResolvedValue([stockSubscription]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(null);

      const result = await queryHandler.execute(memberId);

      expect(result).toEqual([]);
    });

    it('should handle subscriptions with mixed loan status', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        type: 'Acción A',
        value: 100000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const loanId = '990e8400-e29b-41d4-a716-446655440004';
      const subscriptionWithLoan = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: loanId,
      });

      const subscriptionWithoutLoan = StockSubscription.create({
        memberId,
        stockId,
        quantity: 3,
        purchaseDate: new Date('2024-02-20'),
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findActiveByMember')
        .mockResolvedValue([subscriptionWithLoan, subscriptionWithoutLoan]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(memberId);

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.financingLoanId === loanId)).toBeDefined();
      expect(result.find((s) => s.financingLoanId === null)).toBeDefined();
    });
  });
});
