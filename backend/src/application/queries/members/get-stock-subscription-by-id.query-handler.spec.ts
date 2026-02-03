import { GetStockSubscriptionByIdQueryHandler } from './get-stock-subscription-by-id.query-handler';
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
import { StockSubscriptionNotFoundException } from '@application/exceptions/stock-subscription-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { StockBehavior } from '@domain/entities/stock.entity';

describe('GetStockSubscriptionByIdQueryHandler', () => {
  let queryHandler: GetStockSubscriptionByIdQueryHandler;
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

    queryHandler = new GetStockSubscriptionByIdQueryHandler(
      memberRepository,
      stockSubscriptionRepository,
      stockRepository,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const otherMemberId = '660e8400-e29b-41d4-a716-446655440001';
    const subscriptionId = '770e8400-e29b-41d4-a716-446655440002';
    const stockId = '880e8400-e29b-41d4-a716-446655440003';

    it('should throw MemberNotFoundException when member does not exist', async () => {
      const findByIdSpy = jest
        .spyOn(memberRepository, 'findById')
        .mockResolvedValue(null);

      await expect(
        queryHandler.execute(memberId, subscriptionId),
      ).rejects.toThrow(MemberNotFoundException);

      expect(findByIdSpy).toHaveBeenCalledWith(memberId);
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw StockSubscriptionNotFoundException when subscription does not exist', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const findMemberByIdSpy = jest
        .spyOn(memberRepository, 'findById')
        .mockResolvedValue(member);
      const findSubscriptionByIdSpy = jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockResolvedValue(null);

      await expect(
        queryHandler.execute(memberId, subscriptionId),
      ).rejects.toThrow(StockSubscriptionNotFoundException);

      expect(findMemberByIdSpy).toHaveBeenCalledWith(memberId);
      expect(findSubscriptionByIdSpy).toHaveBeenCalledWith(subscriptionId);
    });

    it('should throw StockSubscriptionNotFoundException when subscription belongs to another member', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const subscription = StockSubscription.create({
        memberId: otherMemberId, // Different member
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      const findMemberByIdSpy = jest
        .spyOn(memberRepository, 'findById')
        .mockResolvedValue(member);
      const findSubscriptionByIdSpy = jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockResolvedValue(subscription);

      await expect(
        queryHandler.execute(memberId, subscriptionId),
      ).rejects.toThrow(StockSubscriptionNotFoundException);

      expect(findMemberByIdSpy).toHaveBeenCalledWith(memberId);
      expect(findSubscriptionByIdSpy).toHaveBeenCalledWith(subscriptionId);
    });

    it('should throw StockNotFoundException when stock does not exist', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const subscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      const findMemberByIdSpy = jest
        .spyOn(memberRepository, 'findById')
        .mockResolvedValue(member);
      const findSubscriptionByIdSpy = jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockResolvedValue(subscription);
      const findStockByIdSpy = jest
        .spyOn(stockRepository, 'findById')
        .mockResolvedValue(null);

      await expect(
        queryHandler.execute(memberId, subscriptionId),
      ).rejects.toThrow(StockNotFoundException);

      expect(findMemberByIdSpy).toHaveBeenCalledWith(memberId);
      expect(findSubscriptionByIdSpy).toHaveBeenCalledWith(subscriptionId);
      expect(findStockByIdSpy).toHaveBeenCalledWith(stockId);
    });

    it('should return active subscription successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        name: 'Acción A',
        value: 100000,
        monthlyContribution: 50000,
        stockTypeId: '1',
      });

      const subscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockResolvedValue(subscription);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(memberId, subscriptionId);

      expect(result).toEqual({
        id: subscription.id,
        stockId,
        stockType: stock.name,
        quantity: 2,
        purchaseDate: subscription.purchaseDate,
        status: StockSubscriptionStatus.ACTIVE,
        financingLoanId: null,
      });
    });

    it('should return inactive subscription successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        name: 'Acción A',
        value: 100000,
        monthlyContribution: 50000,
        stockTypeId: '1',
      });

      const subscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 0,
        purchaseDate: new Date('2024-01-15'),
      });
      subscription.update({ status: StockSubscriptionStatus.INACTIVE });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockResolvedValue(subscription);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(memberId, subscriptionId);

      expect(result).toEqual({
        id: subscription.id,
        stockId,
        stockType: stock.name,
        quantity: 0,
        purchaseDate: subscription.purchaseDate,
        status: StockSubscriptionStatus.INACTIVE,
        financingLoanId: null,
      });
    });

    it('should return subscription with financing loan successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        name: 'Acción A',
        value: 100000,
        monthlyContribution: 50000,
        stockTypeId: '1',
      });

      const loanId = '990e8400-e29b-41d4-a716-446655440004';
      const subscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: loanId,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockResolvedValue(subscription);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(memberId, subscriptionId);

      expect(result).toEqual({
        id: subscription.id,
        stockId,
        stockType: stock.name,
        quantity: 2,
        purchaseDate: subscription.purchaseDate,
        status: StockSubscriptionStatus.ACTIVE,
        financingLoanId: loanId,
      });
    });
  });
});
