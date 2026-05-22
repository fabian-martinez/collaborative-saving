import { CreateCdtUseCase } from './create-cdt.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { Stock } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { Meeting } from '@domain/entities/meeting.entity';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';

describe('CreateCdtUseCase', () => {
  let useCase: CreateCdtUseCase;
  let stockRepo: jest.Mocked<StockRepository>;
  let subscriptionRepo: jest.Mocked<StockSubscriptionRepository>;
  let meetingRepo: jest.Mocked<MeetingRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let transactionManager: jest.Mocked<TransactionManager>;

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
      findActiveByStockId: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    meetingRepo = {
      findActive: jest
        .fn()
        .mockResolvedValue(Meeting.create({ date: new Date() })),
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findLastActive: jest.fn(),
      findBeforeDate: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    recordOperationUseCase = {
      execute: jest.fn().mockResolvedValue({ operationId: 'op-1' }),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    transactionManager = {
      execute: jest.fn().mockImplementation(<T>(cb: () => Promise<T>) => cb()),
    } as unknown as jest.Mocked<TransactionManager>;

    useCase = new CreateCdtUseCase(
      stockRepo,
      subscriptionRepo,
      meetingRepo,
      recordOperationUseCase,
      transactionManager,
    );
  });

  it('should create a CDT stock and subscription', async () => {
    const dto = {
      memberId: 'member-123',
      amount: 5000,
      termMonths: 6,
    };

    const result = await useCase.execute(dto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jest.mocked(stockRepo.save)).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const savedStock = jest.mocked(stockRepo.save).mock.calls[0][0];
    expect(savedStock.type).toMatch(/^CDT-member-123-/);
    expect(savedStock.isGuaranteed).toBe(true);
    expect(savedStock.guaranteedYield).toBe(0.015);
    expect(savedStock.value).toBe(5000);
    expect(savedStock.expirationDate).toBeInstanceOf(Date);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jest.mocked(subscriptionRepo.save)).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const savedSub = jest.mocked(subscriptionRepo.save).mock.calls[0][0];
    expect(savedSub.memberId).toBe('member-123');
    expect(savedSub.stockId).toBe(savedStock.id);
    expect(savedSub.quantity).toBe(1);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jest.mocked(recordOperationUseCase.execute)).toHaveBeenCalledTimes(
      1,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const operationDto = jest.mocked(recordOperationUseCase.execute).mock
      .calls[0][0] as RecordOperationDto;
    expect(operationDto.entries).toHaveLength(2);
    expect(operationDto.entries[0].accountType).toBe('STOCK_CAPITAL');
    expect(operationDto.entries[0].amount).toBe(-5000);
    expect(operationDto.entries[1].accountType).toBe('CASH');
    expect(operationDto.entries[1].amount).toBe(5000);

    expect(result.stockId).toBe(savedStock.id);
    expect(result.subscriptionId).toBe(savedSub.id);
    expect(result.value).toBe(5000);
  });

  it('should throw error if amount is invalid', async () => {
    await expect(
      useCase.execute({ memberId: 'm1', amount: 0, termMonths: 6 }),
    ).rejects.toThrow('CDT amount must be greater than 0');
  });

  it('should throw error if term is invalid', async () => {
    await expect(
      useCase.execute({ memberId: 'm1', amount: 100, termMonths: 0 }),
    ).rejects.toThrow('CDT term must be at least 1 month');
  });

  it('should throw error if no active meeting', async () => {
    meetingRepo.findActive.mockResolvedValue(null);
    await expect(
      useCase.execute({ memberId: 'm1', amount: 100, termMonths: 6 }),
    ).rejects.toThrow('Meeting with ID unknown not found');
  });
});
