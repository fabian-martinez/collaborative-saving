import { GetMemberStockExchangesQueryHandler } from './get-member-stock-exchanges.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { Member } from '@domain/entities/member.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  STOCK_CAPITAL_ACCOUNT,
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

describe('GetMemberStockExchangesQueryHandler', () => {
  let queryHandler: GetMemberStockExchangesQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    stockRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
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

    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      findByReference: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      calculateRemainingAmount: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    loanRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    queryHandler = new GetMemberStockExchangesQueryHandler(
      memberRepository,
      stockRepository,
      stockSubscriptionRepository,
      operationRepository,
      ledgerEntryRepository,
      pendingMemberPaymentRepository,
      loanRepository,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '660e8400-e29b-41d4-a716-446655440001';
    const fromStockId = '770e8400-e29b-41d4-a716-446655440002';
    const toStockId = '880e8400-e29b-41d4-a716-446655440003';

    it('should throw error when member not found', async () => {
      jest.spyOn(memberRepository, 'findById').mockResolvedValue(null);

      await expect(
        queryHandler.execute(memberId, { meetingId: undefined }),
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

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toEqual([]);
    });

    it('should return exchanges with cash difference successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const fromStock = Stock.fromPersistence({
        id: fromStockId,
        type: 'Acción Grande',
        value: 1000000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const toStock = Stock.fromPersistence({
        id: toStockId,
        type: 'Acción Super',
        value: 800000,
        monthly_contribution: 40000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const fromSubscription = StockSubscription.create({
        memberId,
        stockId: fromStockId,
        quantity: 1,
        purchaseDate: new Date('2024-01-15'),
      });

      const toSubscription = StockSubscription.create({
        memberId,
        stockId: toStockId,
        quantity: 1,
        purchaseDate: new Date('2024-01-15'),
      });

      const operation = Operation.create({
        memberId,
        meetingId,
        type: OperationType.STOCK_MODIFICATION,
        description: 'Intercambio de acciones',
        date: new Date('2024-01-15'),
      });

      const fromEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: 1000000, // Positive = debit = reduction
        description: 'Reducción de acciones',
        stockSubscriptionId: fromSubscription.id,
        stockId: fromStockId,
      });

      const toEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -800000, // Negative = credit = increase
        description: 'Creación de acciones',
        stockSubscriptionId: toSubscription.id,
        stockId: toStockId,
      });

      const cashEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: CASH_ACCOUNT,
        amount: -200000, // Negative = cash to member
        description: 'Diferencia a favor',
      });

      const pendingPayment = PendingMemberPayment.create({
        memberId,
        meetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: 200000,
        stockSubscriptionId: fromSubscription.id,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([operation]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([fromEntry, toEntry, cashEntry]);
      jest
        .spyOn(stockSubscriptionRepository, 'findByIds')
        .mockResolvedValue([fromSubscription, toSubscription]);
      jest
        .spyOn(stockRepository, 'findByIds')
        .mockResolvedValue([fromStock, toStock]);
      jest
        .spyOn(pendingMemberPaymentRepository, 'findByMember')
        .mockResolvedValue([pendingPayment]);
      jest.spyOn(loanRepository, 'findByIds').mockResolvedValue([]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operationId: operation.id,
        meetingId,
        fromStockId,
        fromStockType: fromStock.type,
        toStockId,
        toStockType: toStock.type,
        difference: 200000,
        differenceHandling: 'cash',
        fromSubscriptionId: fromSubscription.id,
        toSubscriptionId: toSubscription.id,
        pendingPaymentId: pendingPayment.id,
      });
      expect(stockSubscriptionRepository.findByIds).toHaveBeenCalledWith(
        expect.arrayContaining([fromSubscription.id, toSubscription.id]),
      );
      expect(stockSubscriptionRepository.findById).not.toHaveBeenCalled();
    });

    it('should return exchanges with credit difference successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const fromStock = Stock.fromPersistence({
        id: fromStockId,
        type: 'Acción Grande',
        value: 800000,
        monthly_contribution: 40000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const toStock = Stock.fromPersistence({
        id: toStockId,
        type: 'Acción Super',
        value: 1000000,
        monthly_contribution: 50000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const fromSubscription = StockSubscription.create({
        memberId,
        stockId: fromStockId,
        quantity: 1,
        purchaseDate: new Date('2024-01-15'),
      });

      const toSubscription = StockSubscription.create({
        memberId,
        stockId: toStockId,
        quantity: 1,
        purchaseDate: new Date('2024-01-15'),
      });

      const operation = Operation.create({
        memberId,
        meetingId,
        type: OperationType.STOCK_MODIFICATION,
        description: 'Intercambio de acciones',
        date: new Date('2024-01-15'),
      });

      const fromEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: 800000,
        description: 'Reducción de acciones',
        stockSubscriptionId: fromSubscription.id,
        stockId: fromStockId,
      });

      const toEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -1000000,
        description: 'Creación de acciones',
        stockSubscriptionId: toSubscription.id,
        stockId: toStockId,
      });

      const loanId = 'bb0e8400-e29b-41d4-a716-446655440006';
      const loanEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: LOANS_RECEIVABLE_ACCOUNT,
        amount: -200000, // Negative = reduction of loan
        description: 'Abono a crédito',
        loanId,
      });

      const { Loan } = await import('@domain/entities/loan.entity');
      const loan = Loan.create({
        memberId,
        loanType: 'accion',
        approvedAmount: 500000,
        monthlyPaymentAmount: 0,
        interestRate: 0.02,
        term: 12,
      });
      // Override loan ID to match the one in ledger entry
      Object.defineProperty(loan, 'id', {
        value: loanId,
        writable: false,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([operation]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([fromEntry, toEntry, loanEntry]);
      jest
        .spyOn(stockSubscriptionRepository, 'findByIds')
        .mockResolvedValue([fromSubscription, toSubscription]);
      jest
        .spyOn(stockRepository, 'findByIds')
        .mockResolvedValue([fromStock, toStock]);
      jest
        .spyOn(pendingMemberPaymentRepository, 'findByMember')
        .mockResolvedValue([]);
      jest.spyOn(loanRepository, 'findByIds').mockResolvedValue([loan]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operationId: operation.id,
        meetingId,
        fromStockId,
        toStockId,
        difference: -200000,
        differenceHandling: 'credit',
        loanId: loan.id,
      });
      expect(stockSubscriptionRepository.findByIds).toHaveBeenCalledWith(
        expect.arrayContaining([fromSubscription.id, toSubscription.id]),
      );
      expect(stockSubscriptionRepository.findById).not.toHaveBeenCalled();
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

      await queryHandler.execute(memberId, { meetingId });

      expect(findByMemberSpy).toHaveBeenCalledWith(memberId, {
        meetingId,
        types: [OperationType.STOCK_MODIFICATION],
      });
    });
  });
});
