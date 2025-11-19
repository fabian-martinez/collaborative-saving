import { GetMemberStockLoanPaymentsQueryHandler } from './get-member-stock-loan-payments.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Member } from '@domain/entities/member.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { Loan } from '@domain/entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  STOCK_CAPITAL_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

describe('GetMemberStockLoanPaymentsQueryHandler', () => {
  let queryHandler: GetMemberStockLoanPaymentsQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
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

    loanRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    loanTransactionDetailRepository = {
      findById: jest.fn(),
      findByLoan: jest.fn(),
      findByLoanAndMeeting: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

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

    queryHandler = new GetMemberStockLoanPaymentsQueryHandler(
      memberRepository,
      stockRepository,
      stockSubscriptionRepository,
      loanRepository,
      loanTransactionDetailRepository,
      operationRepository,
      ledgerEntryRepository,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '660e8400-e29b-41d4-a716-446655440001';
    const stockId = '770e8400-e29b-41d4-a716-446655440002';
    const loanId = '990e8400-e29b-41d4-a716-446655440004';

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

    it('should return loan payments successfully', async () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '1234567890',
      });

      const stock = Stock.fromPersistence({
        id: stockId,
        type: 'Acción Corriente',
        value: 300000,
        monthly_contribution: 15000,
        is_guaranteed: true,
        guaranteed_yield: 0.05,
        behavior: StockBehavior.CAPITAL_APPRECIATION,
      });

      const subscription = StockSubscription.create({
        memberId,
        stockId,
        quantity: 2,
        purchaseDate: new Date('2024-01-15'),
      });

      const loan = Loan.create({
        memberId,
        loanType: 'accion',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 0,
        interestRate: 0.02,
        term: 24,
      });
      loan.update({ outstandingBalance: 400000 });
      // Override loan ID to match the one in ledger entry
      Object.defineProperty(loan, 'id', {
        value: loanId,
        writable: false,
      });

      const operation = Operation.create({
        memberId,
        meetingId,
        type: OperationType.STOCK_LOAN_PAYMENT,
        description: 'Pago de crédito con acciones',
        date: new Date('2024-01-15'),
      });

      const stockEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: 600000, // Positive = debit = reduction
        description: 'Reducción de acciones',
        stockSubscriptionId: subscription.id,
        stockId,
      });

      const loanEntry = LedgerEntry.create({
        operationId: operation.id,
        accountType: LOANS_RECEIVABLE_ACCOUNT,
        amount: -600000, // Negative = credit = reduction of loan
        description: 'Amortización de préstamo',
        loanId: loan.id,
      });

      const transactionDetail = LoanTransactionDetail.create({
        loanId: loan.id,
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 600000,
        notes: 'Pago con acciones',
        operationId: operation.id,
      });

      jest.spyOn(memberRepository, 'findById').mockResolvedValue(member);
      jest
        .spyOn(operationRepository, 'findByMember')
        .mockResolvedValue([operation]);
      jest
        .spyOn(ledgerEntryRepository, 'findByOperations')
        .mockResolvedValue([stockEntry, loanEntry]);
      jest
        .spyOn(stockSubscriptionRepository, 'findById')
        .mockResolvedValue(subscription);
      jest.spyOn(stockRepository, 'findById').mockResolvedValue(stock);
      jest.spyOn(loanRepository, 'findByIds').mockResolvedValue([loan]);
      jest
        .spyOn(loanTransactionDetailRepository, 'findByLoan')
        .mockResolvedValue([transactionDetail]);

      const result = await queryHandler.execute(memberId, {
        meetingId: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operationId: operation.id,
        meetingId,
        stockId,
        stockType: stock.type,
        quantity: 2,
        paymentValue: 600000,
        loanId: loan.id,
        loanType: loan.loanType,
        previousBalance: 1000000, // newBalance + paymentValue
        newBalance: 400000,
        subscriptionId: subscription.id,
        transactionDetailId: transactionDetail.id,
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

      await queryHandler.execute(memberId, { meetingId });

      expect(findByMemberSpy).toHaveBeenCalledWith(memberId, {
        meetingId,
        types: [OperationType.STOCK_LOAN_PAYMENT],
      });
    });
  });
});
