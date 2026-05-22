import { CloseCdtUseCase } from './close-cdt.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';

describe('CloseCdtUseCase', () => {
  let useCase: CloseCdtUseCase;
  let stockRepo: jest.Mocked<StockRepository>;
  let subscriptionRepo: jest.Mocked<StockSubscriptionRepository>;
  let pendingPaymentRepo: jest.Mocked<PendingMemberPaymentRepository>;

  beforeEach(() => {
    stockRepo = {
      save: jest.fn().mockImplementation((s: Stock) => Promise.resolve(s)),
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findByIds: jest.fn(),
      findActive: jest.fn(),
      saveMany: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    subscriptionRepo = {
      save: jest
        .fn()
        .mockImplementation((s: StockSubscription) => Promise.resolve(s)),
      findByMember: jest.fn(),
      findByStockId: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMemberAndStock: jest.fn(),
      findAllByMemberAndStock: jest.fn(),
      findActiveByMember: jest.fn(),
      findFreeOfFinancing: jest.fn(),
      findByMemberAndStockAndNoLoan: jest.fn(),
      findByFinancingLoan: jest.fn(),
      findByStock: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    pendingPaymentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findPendingByMeeting: jest.fn(),
      findByMeeting: jest.fn(),
      findByMember: jest.fn(),
      findWithFilters: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    useCase = new CloseCdtUseCase(
      stockRepo,
      subscriptionRepo,
      pendingPaymentRepo,
    );
  });

  it('should close a CDT and mark subscription inactive', async () => {
    const mockStock = Stock.create({
      type: 'CDT-member-123',
      value: 5000,
      monthlyContribution: 0,
      isGuaranteed: true,
      guaranteedYield: 0.015,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });

    const mockSub = StockSubscription.create({
      memberId: 'member-123',
      stockId: mockStock.id,
      quantity: 1,
    });

    stockRepo.findById.mockResolvedValue(mockStock);
    subscriptionRepo.findByStock.mockResolvedValue([mockSub]);

    await useCase.execute({ stockId: mockStock.id });

    expect(mockStock.isDeleted()).toBe(true);
    expect(mockSub.isActive()).toBe(false);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(stockRepo.save as jest.Mock).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(subscriptionRepo.save as jest.Mock).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(pendingPaymentRepo.save as jest.Mock).not.toHaveBeenCalled();
  });

  it('should create pending payment if meetingId is provided', async () => {
    const mockStock = Stock.create({
      type: 'CDT-member-123',
      value: 5000,
      monthlyContribution: 0,
      isGuaranteed: true,
      guaranteedYield: 0.015,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });

    const mockSub = StockSubscription.create({
      memberId: 'member-123',
      stockId: mockStock.id,
      quantity: 1,
    });

    stockRepo.findById.mockResolvedValue(mockStock);
    subscriptionRepo.findByStock.mockResolvedValue([mockSub]);

    await useCase.execute({ stockId: mockStock.id, meetingId: 'meeting-1' });

    expect(mockStock.isDeleted()).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(pendingPaymentRepo.save).toHaveBeenCalled();
  });

  it('should throw if stock is not CDT', async () => {
    const mockStock = Stock.create({
      type: 'bono',
      value: 5000,
      monthlyContribution: 0,
      isGuaranteed: true,
      guaranteedYield: 0.015,
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });

    stockRepo.findById.mockResolvedValue(mockStock);

    await expect(useCase.execute({ stockId: mockStock.id })).rejects.toThrow(
      'Stock is not a CDT',
    );
  });
});
