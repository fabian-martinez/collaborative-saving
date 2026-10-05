/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetMeetingFundsSummaryQueryHandler } from './get-meeting-funds-summary.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import {
  StockSubscription,
  StockSubscriptionStatus,
} from '@domain/entities/stock-subscription.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { Operation } from '@domain/entities/operation.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  LOANS_RECEIVABLE_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  CASH_ACCOUNT,
} from '@domain/constants/account-types';

describe('GetMeetingFundsSummaryQueryHandler', () => {
  let queryHandler: GetMeetingFundsSummaryQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;

  let meetingFindByIdSpy: jest.SpyInstance;
  let loanFindAllSpy: jest.SpyInstance;
  let stockFindActiveSpy: jest.SpyInstance;
  let stockSubFindByStocksSpy: jest.SpyInstance;
  let ledgerFindByMeetingSpy: jest.SpyInstance;
  let ledgerFindByOperationsSpy: jest.SpyInstance;
  let operationFindByMeetingSpy: jest.SpyInstance;

  const meetingId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const mockMeeting = new Meeting(
    meetingId,
    new Date('2026-10-01T10:00:00Z'),
    MeetingStatus.ACTIVE,
    'Reunión de prueba',
    new Date('2026-10-01T10:00:00Z'),
  );

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findByDate: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    loanRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
      hasActiveLoansByType: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    stockRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findGuaranteed: jest.fn(),
      hasActiveStocksByType: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByMemberAndStock: jest.fn(),
      findAllByMemberAndStock: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findFreeOfFinancing: jest.fn(),
      findByMemberAndStockAndNoLoan: jest.fn(),
      findByFinancingLoan: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findByStock: jest.fn(),
      findByStocks: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
      getAccountsSummary: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMeetingAndTypes: jest.fn(),
      findByMember: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    meetingFindByIdSpy = jest.spyOn(meetingRepository, 'findById');
    loanFindAllSpy = jest.spyOn(loanRepository, 'findAll');
    stockFindActiveSpy = jest.spyOn(stockRepository, 'findActive');
    stockSubFindByStocksSpy = jest.spyOn(
      stockSubscriptionRepository,
      'findByStocks',
    );
    ledgerFindByMeetingSpy = jest.spyOn(ledgerEntryRepository, 'findByMeeting');
    ledgerFindByOperationsSpy = jest.spyOn(
      ledgerEntryRepository,
      'findByOperations',
    );
    operationFindByMeetingSpy = jest.spyOn(
      operationRepository,
      'findByMeeting',
    );

    queryHandler = new GetMeetingFundsSummaryQueryHandler(
      meetingRepository,
      loanRepository,
      stockRepository,
      stockSubscriptionRepository,
      ledgerEntryRepository,
      operationRepository,
    );
  });

  describe('execute', () => {
    it('should throw MeetingNotFoundException when meeting does not exist', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(queryHandler.execute(meetingId)).rejects.toThrow(
        MeetingNotFoundException,
      );
      expect(meetingFindByIdSpy).toHaveBeenCalledWith(meetingId);
      expect(meetingFindByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should return aggregated funds summary for a valid meeting with active loans, collections and stocks', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);

      // Loans setup
      const loan1 = new Loan(
        'loan-1',
        'member-1',
        'corriente',
        1000000,
        1000000,
        800000,
        100000,
        0.015,
        12,
        LoanStatus.ACTIVE,
        new Date('2026-01-01'),
      );
      const loan2 = new Loan(
        'loan-2',
        'member-2',
        'corriente',
        500000,
        500000,
        200000,
        50000,
        0.015,
        10,
        LoanStatus.ACTIVE,
        new Date('2026-02-01'),
      );
      const loan3 = new Loan(
        'loan-3',
        'member-3',
        'agil',
        300000,
        300000,
        300000,
        150000,
        0.02,
        2,
        LoanStatus.ACTIVE,
        new Date('2026-03-01'),
      );
      const paidLoan = new Loan(
        'loan-4',
        'member-4',
        'accion',
        400000,
        400000,
        0,
        100000,
        0.015,
        4,
        LoanStatus.PAID,
        new Date('2026-01-01'),
      );

      loanRepository.findAll.mockResolvedValue([loan1, loan2, loan3, paidLoan]);

      // Operations setup
      const op1 = new Operation(
        'op-1',
        'member-1',
        meetingId,
        OperationType.LOAN_PAYMENT,
        new Date('2026-10-01'),
        'Pago préstamo corriente',
      );
      const op2 = new Operation(
        'op-2',
        'member-3',
        meetingId,
        OperationType.LOAN_PAYMENT,
        new Date('2026-10-01'),
        'Pago préstamo ágil',
      );
      operationRepository.findByMeeting.mockResolvedValue([op1, op2]);

      // Ledger entries setup (credits are negative)
      const entryPrincipal1 = new LedgerEntry(
        'entry-1',
        'op-1',
        LOANS_RECEIVABLE_ACCOUNT,
        -100000,
        new Date('2026-10-01'),
        'Abono capital préstamo',
        'loan-1',
      );
      const entryInterest1 = new LedgerEntry(
        'entry-2',
        'op-1',
        INTEREST_INCOME_ACCOUNT,
        -12000,
        new Date('2026-10-01'),
        'Intereses préstamo',
        'loan-1',
      );
      const entryPrincipal2 = new LedgerEntry(
        'entry-3',
        'op-2',
        LOANS_RECEIVABLE_ACCOUNT,
        -50000,
        new Date('2026-10-01'),
        'Abono capital agil',
        'loan-3',
      );
      const entryInterest2 = new LedgerEntry(
        'entry-4',
        'op-2',
        INTEREST_INCOME_ACCOUNT,
        -6000,
        new Date('2026-10-01'),
        'Intereses agil',
        'loan-3',
      );

      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        entryPrincipal1,
        entryInterest1,
        entryPrincipal2,
        entryInterest2,
      ]);

      // Stocks setup
      const stock1 = new Stock(
        'stock-1',
        'Acciones Ordinarias',
        10000,
        50000,
        false,
        null,
        StockBehavior.CAPITAL_APPRECIATION,
        new Date('2026-01-01'),
      );
      const stock2 = new Stock(
        'stock-2',
        'Acciones Preferenciales',
        20000,
        100000,
        true,
        0.05,
        StockBehavior.DIVIDEND_YIELD,
        new Date('2026-01-01'),
      );
      stockRepository.findActive.mockResolvedValue([stock1, stock2]);

      // Stock subscriptions setup
      const sub1 = new StockSubscription(
        'sub-1',
        'member-1',
        'stock-1',
        15,
        StockSubscriptionStatus.ACTIVE,
        new Date('2026-01-01'),
      );
      const sub2 = new StockSubscription(
        'sub-2',
        'member-2',
        'stock-1',
        10,
        StockSubscriptionStatus.ACTIVE,
        new Date('2026-01-01'),
      );
      const sub3 = new StockSubscription(
        'sub-3',
        'member-1',
        'stock-2',
        5,
        StockSubscriptionStatus.ACTIVE,
        new Date('2026-01-01'),
      );
      const inactiveSub = new StockSubscription(
        'sub-4',
        'member-3',
        'stock-2',
        8,
        StockSubscriptionStatus.INACTIVE,
        new Date('2026-01-01'),
      );

      stockSubscriptionRepository.findByStocks.mockResolvedValue([
        sub1,
        sub2,
        sub3,
        inactiveSub,
      ]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      expect(meetingFindByIdSpy).toHaveBeenCalledWith(meetingId);
      expect(loanFindAllSpy).toHaveBeenCalledTimes(1);
      expect(operationFindByMeetingSpy).toHaveBeenCalledWith(meetingId);
      expect(ledgerFindByMeetingSpy).toHaveBeenCalledWith(meetingId);
      expect(stockFindActiveSpy).toHaveBeenCalledTimes(1);
      expect(stockSubFindByStocksSpy).toHaveBeenCalledWith([
        'stock-1',
        'stock-2',
      ]);

      expect(result.meetingId).toBe(meetingId);

      // Verify loans by type breakdown
      expect(result.loansByType).toHaveLength(4);

      // Corriente
      const corriente = result.loansByType.find(
        (l) => l.loanType === 'corriente',
      );
      expect(corriente).toBeDefined();
      expect(corriente?.loanTypeName).toBe('Corriente');
      expect(corriente?.outstandingBalance).toBe(1000000); // 800000 + 200000
      expect(corriente?.activeCount).toBe(2);
      expect(corriente?.collectedThisMeeting).toEqual({
        principal: 100000,
        interest: 12000,
        total: 112000,
      });

      // Agil
      const agil = result.loansByType.find((l) => l.loanType === 'agil');
      expect(agil).toBeDefined();
      expect(agil?.loanTypeName).toBe('Ágil');
      expect(agil?.outstandingBalance).toBe(300000);
      expect(agil?.activeCount).toBe(1);
      expect(agil?.collectedThisMeeting).toEqual({
        principal: 50000,
        interest: 6000,
        total: 56000,
      });

      // Prioritario (no active loans, no collections)
      const prioritario = result.loansByType.find(
        (l) => l.loanType === 'prioritario',
      );
      expect(prioritario).toBeDefined();
      expect(prioritario?.loanTypeName).toBe('Prioritario');
      expect(prioritario?.outstandingBalance).toBe(0);
      expect(prioritario?.activeCount).toBe(0);
      expect(prioritario?.collectedThisMeeting).toEqual({
        principal: 0,
        interest: 0,
        total: 0,
      });

      // Accion (PAID loan, no active loans, no collections)
      const accion = result.loansByType.find((l) => l.loanType === 'accion');
      expect(accion).toBeDefined();
      expect(accion?.loanTypeName).toBe('Acción');
      expect(accion?.outstandingBalance).toBe(0);
      expect(accion?.activeCount).toBe(0);
      expect(accion?.collectedThisMeeting).toEqual({
        principal: 0,
        interest: 0,
        total: 0,
      });

      // Verify stocks by type breakdown
      expect(result.stocksByType).toHaveLength(2);

      const stockSummary1 = result.stocksByType.find(
        (s) => s.stockId === 'stock-1',
      );
      expect(stockSummary1).toEqual({
        stockId: 'stock-1',
        stockName: 'Acciones Ordinarias',
        stockType: 'Acciones Ordinarias',
        isGuaranteed: false,
        totalShares: 25, // 15 + 10
        shareValue: 10000,
        totalValue: 250000, // 25 * 10000
        activeSubscriptionsCount: 2,
      });

      const stockSummary2 = result.stocksByType.find(
        (s) => s.stockId === 'stock-2',
      );
      expect(stockSummary2).toEqual({
        stockId: 'stock-2',
        stockName: 'Acciones Preferenciales',
        stockType: 'Acciones Preferenciales',
        isGuaranteed: true,
        totalShares: 5, // Only active sub3, sub4 is inactive
        shareValue: 20000,
        totalValue: 100000, // 5 * 20000
        activeSubscriptionsCount: 1,
      });
    });

    it('should report 0 for collectedThisMeeting when no loan payments occurred', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);
      loanRepository.findAll.mockResolvedValue([]);
      operationRepository.findByMeeting.mockResolvedValue([]);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([]);
      stockRepository.findActive.mockResolvedValue([]);
      stockSubscriptionRepository.findByStocks.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      expect(result.loansByType).toHaveLength(4);
      for (const loanSummary of result.loansByType) {
        expect(loanSummary.outstandingBalance).toBe(0);
        expect(loanSummary.activeCount).toBe(0);
        expect(loanSummary.collectedThisMeeting).toEqual({
          principal: 0,
          interest: 0,
          total: 0,
        });
      }
      expect(result.stocksByType).toEqual([]);
    });

    it('should use findByOperations as fallback when findByMeeting returns empty but operations exist', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);

      const loan = new Loan(
        'loan-1',
        'member-1',
        'corriente',
        100000,
        100000,
        50000,
        10000,
        0.015,
        10,
        LoanStatus.ACTIVE,
        new Date('2026-01-01'),
      );
      loanRepository.findAll.mockResolvedValue([loan]);

      const op = new Operation(
        'op-1',
        'member-1',
        meetingId,
        OperationType.LOAN_PAYMENT,
        new Date('2026-10-01'),
      );
      operationRepository.findByMeeting.mockResolvedValue([op]);

      // findByMeeting returns empty array
      ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

      // findByOperations returns the entries
      const principalEntry = new LedgerEntry(
        'entry-1',
        'op-1',
        LOANS_RECEIVABLE_ACCOUNT,
        -20000,
        new Date('2026-10-01'),
        'Pago',
        'loan-1',
      );
      ledgerEntryRepository.findByOperations.mockResolvedValue([
        principalEntry,
      ]);

      stockRepository.findActive.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      expect(ledgerFindByMeetingSpy).toHaveBeenCalledWith(meetingId);
      expect(ledgerFindByOperationsSpy).toHaveBeenCalledWith(['op-1']);

      const corriente = result.loansByType.find(
        (l) => l.loanType === 'corriente',
      );
      expect(corriente?.collectedThisMeeting.principal).toBe(20000);
      expect(corriente?.collectedThisMeeting.total).toBe(20000);
    });

    it('should ignore disbursement ledger entries so they are not counted as collections', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);

      const loan = new Loan(
        'loan-1',
        'member-1',
        'corriente',
        500000,
        500000,
        500000,
        50000,
        0.015,
        10,
        LoanStatus.ACTIVE,
        new Date('2026-10-01'),
      );
      loanRepository.findAll.mockResolvedValue([loan]);

      const disbursementOp = new Operation(
        'op-disburse',
        'member-1',
        meetingId,
        OperationType.LOAN_DISBURSEMENT,
        new Date('2026-10-01'),
        'Desembolso de préstamo',
      );
      operationRepository.findByMeeting.mockResolvedValue([disbursementOp]);

      // During disbursement: LOANS_RECEIVABLE is debited (+500000), CASH credited (-500000)
      const disbursementEntry = new LedgerEntry(
        'entry-disburse',
        'op-disburse',
        LOANS_RECEIVABLE_ACCOUNT,
        500000,
        new Date('2026-10-01'),
        'Desembolso de préstamo',
        'loan-1',
      );
      const cashEntry = new LedgerEntry(
        'entry-cash',
        'op-disburse',
        CASH_ACCOUNT,
        -500000,
        new Date('2026-10-01'),
        'Desembolso salida caja',
        'loan-1',
      );
      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        disbursementEntry,
        cashEntry,
      ]);

      stockRepository.findActive.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      const corriente = result.loansByType.find(
        (l) => l.loanType === 'corriente',
      );
      expect(corriente?.outstandingBalance).toBe(500000);
      expect(corriente?.activeCount).toBe(1);
      // Collections must be 0, not 500000
      expect(corriente?.collectedThisMeeting).toEqual({
        principal: 0,
        interest: 0,
        total: 0,
      });
    });

    it('should resolve loanId from sibling entries of the same operation if an entry lacks direct loanId', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);

      const loan = new Loan(
        'loan-1',
        'member-1',
        'prioritario',
        200000,
        200000,
        150000,
        50000,
        0.02,
        4,
        LoanStatus.ACTIVE,
        new Date('2026-05-01'),
      );
      loanRepository.findAll.mockResolvedValue([loan]);

      const op = new Operation(
        'op-1',
        'member-1',
        meetingId,
        OperationType.LOAN_PAYMENT,
        new Date('2026-10-01'),
      );
      operationRepository.findByMeeting.mockResolvedValue([op]);

      // Principal entry has loanId
      const principalEntry = new LedgerEntry(
        'entry-1',
        'op-1',
        LOANS_RECEIVABLE_ACCOUNT,
        -40000,
        new Date('2026-10-01'),
        'Abono capital',
        'loan-1',
      );
      // Interest entry lacks direct loanId, but belongs to same operation
      const interestEntry = new LedgerEntry(
        'entry-2',
        'op-1',
        INTEREST_INCOME_ACCOUNT,
        -3000,
        new Date('2026-10-01'),
        'Intereses',
        null,
      );

      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        principalEntry,
        interestEntry,
      ]);

      stockRepository.findActive.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      const prioritario = result.loansByType.find(
        (l) => l.loanType === 'prioritario',
      );
      expect(prioritario?.collectedThisMeeting).toEqual({
        principal: 40000,
        interest: 3000,
        total: 43000,
      });
    });

    it('should include custom loan types and format their names properly', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);

      const customLoan = new Loan(
        'loan-custom',
        'member-1',
        'educativo',
        3000000,
        3000000,
        2500000,
        250000,
        0.01,
        12,
        LoanStatus.ACTIVE,
        new Date('2026-06-01'),
      );
      loanRepository.findAll.mockResolvedValue([customLoan]);

      operationRepository.findByMeeting.mockResolvedValue([]);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([]);
      stockRepository.findActive.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      expect(result.loansByType).toHaveLength(5);
      const custom = result.loansByType.find((l) => l.loanType === 'educativo');
      expect(custom).toBeDefined();
      expect(custom?.loanTypeName).toBe('Educativo');
      expect(custom?.outstandingBalance).toBe(2500000);
      expect(custom?.activeCount).toBe(1);
    });

    it('should handle stocks with 0 subscriptions', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);
      loanRepository.findAll.mockResolvedValue([]);
      operationRepository.findByMeeting.mockResolvedValue([]);
      ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

      const stock = new Stock(
        'stock-empty',
        'Acción Nueva',
        15000,
        30000,
        false,
        null,
        StockBehavior.CAPITAL_APPRECIATION,
        new Date('2026-09-01'),
      );
      stockRepository.findActive.mockResolvedValue([stock]);
      stockSubscriptionRepository.findByStocks.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      expect(result.stocksByType).toHaveLength(1);
      expect(result.stocksByType[0]).toEqual({
        stockId: 'stock-empty',
        stockName: 'Acción Nueva',
        stockType: 'Acción Nueva',
        isGuaranteed: false,
        totalShares: 0,
        shareValue: 15000,
        totalValue: 0,
        activeSubscriptionsCount: 0,
      });
    });

    it('should skip ledger entries that are neither principal nor interest', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);
      loanRepository.findAll.mockResolvedValue([]);

      const op = new Operation(
        'op-fee',
        'member-1',
        meetingId,
        OperationType.FEE,
        new Date('2026-10-01'),
      );
      operationRepository.findByMeeting.mockResolvedValue([op]);

      const cashEntry = new LedgerEntry(
        'entry-fee',
        'op-fee',
        CASH_ACCOUNT,
        15000,
        new Date('2026-10-01'),
      );
      ledgerEntryRepository.findByMeeting.mockResolvedValue([cashEntry]);
      stockRepository.findActive.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      for (const loan of result.loansByType) {
        expect(loan.collectedThisMeeting.total).toBe(0);
      }
    });

    it('should handle collection on a custom loan type that has no active loans and sort multiple custom types', async () => {
      // ARRANGE
      meetingRepository.findById.mockResolvedValue(mockMeeting);

      // Custom loans that are PAID (not active)
      const paidVehicular = new Loan(
        'loan-vehicular',
        'member-1',
        'vehicular',
        5000000,
        5000000,
        0,
        500000,
        0.015,
        10,
        LoanStatus.PAID,
        new Date('2026-01-01'),
      );
      const paidComercial = new Loan(
        'loan-comercial',
        'member-2',
        'comercial',
        10000000,
        10000000,
        0,
        1000000,
        0.02,
        10,
        LoanStatus.PAID,
        new Date('2026-01-01'),
      );
      loanRepository.findAll.mockResolvedValue([paidVehicular, paidComercial]);

      const op = new Operation(
        'op-pay',
        'member-1',
        meetingId,
        OperationType.LOAN_PAYMENT,
        new Date('2026-10-01'),
      );
      operationRepository.findByMeeting.mockResolvedValue([op]);

      const entryVehicular = new LedgerEntry(
        'entry-v',
        'op-pay',
        LOANS_RECEIVABLE_ACCOUNT,
        -500000,
        new Date('2026-10-01'),
        'Pago final vehicular',
        'loan-vehicular',
      );
      const entryComercial = new LedgerEntry(
        'entry-c',
        'op-pay',
        INTEREST_INCOME_ACCOUNT,
        -200000,
        new Date('2026-10-01'),
        'Pago final comercial',
        'loan-comercial',
      );

      ledgerEntryRepository.findByMeeting.mockResolvedValue([
        entryVehicular,
        entryComercial,
      ]);
      stockRepository.findActive.mockResolvedValue([]);

      // ACT
      const result = await queryHandler.execute(meetingId);

      // ASSERT
      expect(result.loansByType).toHaveLength(6); // 4 default + comercial + vehicular
      const comercial = result.loansByType.find(
        (l) => l.loanType === 'comercial',
      );
      expect(comercial?.loanTypeName).toBe('Comercial');
      expect(comercial?.collectedThisMeeting.interest).toBe(200000);
      expect(comercial?.activeCount).toBe(0);

      const vehicular = result.loansByType.find(
        (l) => l.loanType === 'vehicular',
      );
      expect(vehicular?.loanTypeName).toBe('Vehicular');
      expect(vehicular?.collectedThisMeeting.principal).toBe(500000);
      expect(vehicular?.activeCount).toBe(0);

      // Check sorting: default types first, then comercial, then vehicular
      const types = result.loansByType.map((l) => l.loanType);
      expect(types).toEqual([
        'corriente',
        'prioritario',
        'agil',
        'accion',
        'comercial',
        'vehicular',
      ]);
    });
  });
});
