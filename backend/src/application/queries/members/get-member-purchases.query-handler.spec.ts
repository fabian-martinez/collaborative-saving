import { GetMemberPurchasesQueryHandler } from './get-member-purchases.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Member } from '@domain/entities/member.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Stock } from '@domain/entities/stock.entity';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { OperationType } from '@domain/enums/operation-type.enum';
import { StockBehavior } from '@domain/entities/stock.entity';
import { STOCK_CAPITAL_ACCOUNT } from '@domain/constants/account-types';

describe('GetMemberPurchasesQueryHandler', () => {
  let queryHandler: GetMemberPurchasesQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;

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

    loanRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

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

    queryHandler = new GetMemberPurchasesQueryHandler(
      memberRepository,
      stockSubscriptionRepository,
      stockRepository,
      loanRepository,
      operationRepository,
      ledgerEntryRepository,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '660e8400-e29b-41d4-a716-446655440001';
    const stockId = '770e8400-e29b-41d4-a716-446655440002';

    it('should throw error when member not found', async () => {
      const findByIdSpy = jest
        .spyOn(memberRepository, 'findById')
        .mockResolvedValue(null);

      await expect(
        queryHandler.execute(memberId, { meetingId: undefined }),
      ).rejects.toThrow(MemberNotFoundException);

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
        .spyOn(stockSubscriptionRepository, 'findByMember')
        .mockResolvedValue([]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toEqual([]);
    });

    it('should return empty array when no operations found', async () => {
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
        .spyOn(stockSubscriptionRepository, 'findByMember')
        .mockResolvedValue([stockSubscription]);
      jest.spyOn(operationRepository, 'findByMember').mockResolvedValue([]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toEqual([]);
    });

    it('should return purchases without loan successfully', async () => {
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

      const operation = Operation.create({
        memberId,
        meetingId,
        type: OperationType.STOCK_PURCHASE,
        description: 'Compra de acciones',
        date: new Date('2024-01-15'),
      });

      const ledgerEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -200000,
        description: 'Test entry',
        stockSubscriptionId: stockSubscription.id,
        stockId,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findByMember')
        .mockResolvedValue([stockSubscription]);
      jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([operation]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([ledgerEntry]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);
      jest.spyOn(loanRepository, 'findByIds').mockResolvedValue([]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        stockSubscriptionId: stockSubscription.id,
        stockId,
        stockType: stock.type,
        quantity: 2,
        unitValue: 100000,
        totalValue: 200000,
        purchaseDate: stockSubscription.purchaseDate,
        meetingId,
        operationId: operation.id,
        loan: null,
      });
    });

    it('should return purchases with loan successfully', async () => {
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

      const loan = Loan.create({
        memberId,
        loanType: 'accion',
        approvedAmount: 150000,
        monthlyPaymentAmount: 0,
        interestRate: 0.02,
        term: 24,
      });
      loan.update({
        disbursedAmount: 150000,
        outstandingBalance: 150000,
        status: LoanStatus.ACTIVE,
      });

      const stockSubscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
        financingLoanId: loan.id,
      });

      const operation = Operation.create({
        memberId,
        meetingId,
        type: OperationType.STOCK_PURCHASE,
        description: 'Compra de acciones',
        date: new Date('2024-01-15'),
      });

      const ledgerEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -200000,
        description: 'Test entry',
        stockSubscriptionId: stockSubscription.id,
        stockId,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findByMember')
        .mockResolvedValue([stockSubscription]);
      jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([operation]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([ledgerEntry]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);
      jest.spyOn(loanRepository, 'findByIds').mockResolvedValue([loan]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        stockSubscriptionId: stockSubscription.id,
        stockId,
        stockType: stock.type,
        quantity: 2,
        unitValue: 100000,
        totalValue: 200000,
        purchaseDate: stockSubscription.purchaseDate,
        meetingId,
        operationId: operation.id,
        loan: {
          loanId: loan.id,
          approvedAmount: loan.approvedAmount,
          interestRate: loan.interestRate,
          status: loan.status,
        },
      });
    });

    it('should filter by meetingId when provided', async () => {
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

      const operation = Operation.create({
        memberId,
        meetingId,
        type: OperationType.STOCK_PURCHASE,
        description: 'Compra de acciones',
        date: new Date('2024-01-15'),
      });

      const ledgerEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -200000,
        description: 'Test entry',
        stockSubscriptionId: stockSubscription.id,
        stockId,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(stockSubscriptionRepository, 'findByMember')
        .mockResolvedValue([stockSubscription]);
      jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([operation]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([ledgerEntry]);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);
      jest.spyOn(loanRepository, 'findByIds').mockResolvedValue([]);

      const result = await queryHandler.execute(memberId, {
        meetingId,
      });

      expect(result).toHaveLength(1);
      const findByMemberSpy = jest.spyOn(operationRepository, 'findByMember');
      expect(findByMemberSpy).toHaveBeenCalledWith(memberId, {
        meetingId,
        types: [OperationType.STOCK_PURCHASE],
      });
    });

    it('should skip subscriptions without corresponding operations', async () => {
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
        .spyOn(stockSubscriptionRepository, 'findByMember')
        .mockResolvedValue([stockSubscription]);
      jest.spyOn(operationRepository, 'findByMember').mockResolvedValue([]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toEqual([]);
    });
  });
});
