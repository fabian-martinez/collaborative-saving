import { GetMemberStockTransfersQueryHandler } from './get-member-stock-transfers.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Member } from '@domain/entities/member.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { OperationType } from '@domain/enums/operation-type.enum';
import { STOCK_CAPITAL_ACCOUNT } from '@domain/constants/account-types';

describe('GetMemberStockTransfersQueryHandler', () => {
  let queryHandler: GetMemberStockTransfersQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

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

    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMember: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    queryHandler = new GetMemberStockTransfersQueryHandler(
      memberRepository,
      stockRepository,
      stockSubscriptionRepository,
      operationRepository,
      ledgerEntryRepository,
    );
  });

  describe('execute', () => {
    const fromMemberId = '550e8400-e29b-41d4-a716-446655440000';
    const toMemberId = '660e8400-e29b-41d4-a716-446655440001';
    const meetingId = '770e8400-e29b-41d4-a716-446655440002';
    const stockId = '880e8400-e29b-41d4-a716-446655440003';

    it('should throw error when member not found', async () => {
      jest.spyOn(memberRepository, 'findById').mockResolvedValue(null);

      await expect(
        queryHandler.execute(fromMemberId, { meetingId: undefined }),
      ).rejects.toThrow(MemberNotFoundException);
    });

    it('should return empty array when no operations found', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest.spyOn(operationRepository, 'findByMember').mockResolvedValue([]);

      const result = await queryHandler.execute(fromMemberId, {
        meetingId: undefined,
      });

      expect(result).toEqual([]);
    });

    it('should return transfers successfully', async () => {
      const fromMember = Member.create({
        name: 'Alice',
        email: 'alice@example.com',
        identificationNumber: '1234567890',
      });

      const toMember = Member.create({
        name: 'Bob',
        email: 'bob@example.com',
        identificationNumber: '0987654321',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        type: 'Acción Mediana',
        value: 500000,
        monthly_contribution: 25000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const fromSubscription = StockSubscription.create({
        memberId: fromMemberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      const toSubscription = StockSubscription.create({
        memberId: toMemberId,
        stockId,
        quantity: 0,
        purchaseDate: new Date('2024-01-15'),
      });

      const operation = Operation.create({
        memberId: fromMemberId,
        meetingId,
        type: OperationType.STOCK_TRANSFER,
        description: 'Transferencia de 2 acciones Mediana a Bob',
        date: new Date('2024-01-15'),
      });

      const fromEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: 1000000, // Positive = debit = reduction
        description: 'Transferencia de acciones',
        stockSubscriptionId: fromSubscription.id,
        stockId,
      });

      const toEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -1000000, // Negative = credit = increase
        description: 'Recepción de acciones',
        stockSubscriptionId: toSubscription.id,
        stockId,
      });

      jest
        .spyOn(memberRepository, 'findById')
        .mockImplementation((id: string) => {
          if (id === fromMemberId) {
            return Promise.resolve(fromMember);
          }
          if (id === toMemberId) {
            return Promise.resolve(toMember);
          }
          return Promise.resolve(null);
        });
      jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([operation]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([fromEntry, toEntry]);
      jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockImplementation((id: string) => {
          if (id === fromSubscription.id) {
            return Promise.resolve(fromSubscription);
          }
          if (id === toSubscription.id) {
            return Promise.resolve(toSubscription);
          }
          return Promise.resolve(null);
        });
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);

      const result = await queryHandler.execute(fromMemberId, {
        meetingId: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operationId: operation.id,
        meetingId,
        stockId,
        stockType: stock.type,
        quantity: 2,
        value: 1000000,
        fromMemberId,
        fromMemberName: fromMember.name,
        toMemberId,
        toMemberName: toMember.name,
        fromSubscriptionId: fromSubscription.id,
        toSubscriptionId: toSubscription.id,
      });
    });

    it('should filter by meetingId when provided', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      const findByMemberSpy = jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([]);

      await queryHandler.execute(fromMemberId, { meetingId });

      expect(findByMemberSpy).toHaveBeenCalledWith(fromMemberId, {
        meetingId,
        types: [OperationType.STOCK_TRANSFER],
      });
    });
  });
});
