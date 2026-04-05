import { GetMemberDuesForActiveMeetingQueryHandler } from './get-member-dues-for-active-meeting.query-handler';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Meeting } from '@domain/entities/meeting.entity';
import { Member } from '@domain/entities/member.entity';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Loan } from '@domain/entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { Stock } from '@domain/entities/stock.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { PaymentType } from '@domain/enums/payment-type.enum';
import { MemberDueResponseDto } from '@application/dto/members/member-due-response.dto';

describe('GetMemberDuesForActiveMeetingQueryHandler', () => {
  let queryHandler: GetMemberDuesForActiveMeetingQueryHandler;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let mandatoryContributionRepository: jest.Mocked<MandatoryContributionRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let stockRepository: jest.Mocked<StockRepository>;

  let findActiveSpy: jest.SpyInstance;
  let findByIdMemberSpy: jest.SpyInstance;
  let findAllMandatorySpy: jest.SpyInstance;
  let findActiveByMemberSpy: jest.SpyInstance;
  let findActiveByMemberLoanSpy: jest.SpyInstance;
  let findByLoanAndMeetingSpy: jest.SpyInstance;
  let findByIdStockSpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    mandatoryContributionRepository = {
      findById: jest.fn(),
      findByAssetType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MandatoryContributionRepository>;

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
      findActiveByMember: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    loanTransactionDetailRepository = {
      findById: jest.fn(),
      findByLoan: jest.fn(),
      findByLoanAndMeeting: jest.fn(),
      findByLoansAndMeeting: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

    stockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    findActiveSpy = jest.spyOn(meetingRepository, 'findActive');
    findByIdMemberSpy = jest.spyOn(memberRepository, 'findById');
    findAllMandatorySpy = jest.spyOn(
      mandatoryContributionRepository,
      'findAll',
    );
    findActiveByMemberSpy = jest.spyOn(
      stockSubscriptionRepository,
      'findActiveByMember',
    );
    findActiveByMemberLoanSpy = jest.spyOn(
      loanRepository,
      'findActiveByMember',
    );
    findByLoanAndMeetingSpy = jest.spyOn(
      loanTransactionDetailRepository,
      'findByLoansAndMeeting',
    );
    findByIdStockSpy = jest.spyOn(stockRepository, 'findById');

    queryHandler = new GetMemberDuesForActiveMeetingQueryHandler(
      meetingRepository,
      memberRepository,
      mandatoryContributionRepository,
      stockSubscriptionRepository,
      loanRepository,
      loanTransactionDetailRepository,
      stockRepository,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '660e8400-e29b-41d4-a716-446655440001';

    it('should return all dues when member has all types of obligations', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
        notes: 'Test meeting',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const mandatoryContributions = [
        MandatoryContribution.create({ assetType: 'insurance', value: 5000 }),
        MandatoryContribution.create({ assetType: 'fee', value: 10000 }),
      ];

      const stockSubscriptions = [
        StockSubscription.create({
          memberId,
          stockId: 'stock-1',
          quantity: 5,
        }),
        StockSubscription.create({
          memberId,
          stockId: 'stock-1',
          quantity: 3,
        }), // Mismo stock, debería agruparse
        StockSubscription.create({
          memberId,
          stockId: 'stock-2',
          quantity: 2,
        }),
      ];

      const activeLoans = [
        Loan.create({
          memberId,
          loanType: 'personal',
          approvedAmount: 100000,
          monthlyPaymentAmount: 5000,
          interestRate: 0.02,
          term: 12,
        }),
      ];

      const stock1 = Stock.create({
        name: 'Type A',
        value: 10000,
        monthlyContribution: 2000,
        stockTypeId: '1',
      });
      const stock2 = Stock.create({
        name: 'Type B',
        value: 15000,
        monthlyContribution: 3000,
        stockTypeId: '1',
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue(mandatoryContributions);
      findActiveByMemberSpy.mockResolvedValue(stockSubscriptions);
      findActiveByMemberLoanSpy.mockResolvedValue(activeLoans);
      findByLoanAndMeetingSpy.mockResolvedValue([]); // No hay pagos de interés
      findByIdStockSpy
        .mockResolvedValueOnce(stock1)
        .mockResolvedValueOnce(stock2);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      expect(findActiveSpy).toHaveBeenCalledTimes(1);
      expect(findByIdMemberSpy).toHaveBeenCalledWith(memberId);
      expect(result).toHaveLength(5); // 2 mandatory + 2 stock + 1 loan

      // Verificar mandatory contributions
      const mandatoryDues = result.filter(
        (due) => due.type === PaymentType.MANDATORY_CONTRIBUTION,
      );
      expect(mandatoryDues).toHaveLength(2);
      expect(mandatoryDues).toContainEqual({
        type: PaymentType.MANDATORY_CONTRIBUTION,
        description: 'insurance',
        amount: 5000,
        referenceId: mandatoryContributions[0].id,
      });
      expect(mandatoryDues).toContainEqual({
        type: PaymentType.MANDATORY_CONTRIBUTION,
        description: 'fee',
        amount: 10000,
        referenceId: mandatoryContributions[1].id,
      });

      // Verificar stock fees (debe agrupar stock-1: 5 + 3 = 8)
      const stockDues = result.filter(
        (due) => due.type === PaymentType.STOCK_FEE,
      );
      expect(stockDues).toHaveLength(2);
      expect(stockDues).toContainEqual({
        type: PaymentType.STOCK_FEE,
        description: 'Cuota de acción: Type A',
        amount: 16000, // 8 * 2000
        referenceId: stock1.id,
        monthlyContribution: 2000,
        stockQuantity: 8,
      });
      expect(stockDues).toContainEqual({
        type: PaymentType.STOCK_FEE,
        description: 'Cuota de acción: Type B',
        amount: 6000, // 2 * 3000
        referenceId: stock2.id,
        monthlyContribution: 3000,
        stockQuantity: 2,
      });

      // Verificar loan payment
      const loanDues = result.filter(
        (due) => due.type === PaymentType.LOAN_PAYMENT,
      );
      expect(loanDues).toHaveLength(1);
      expect(loanDues[0]).toMatchObject({
        type: PaymentType.LOAN_PAYMENT,
        description: 'Cuota préstamo: personal',
        amount: 7000, // 5000 (principal) + 2000 (2% de 100000)
        referenceId: activeLoans[0].id,
        details: {
          interest: 2000,
          principal: 5000,
          outstanding_balance: 100000,
        },
      });
    });

    it('should return all dues when no active meeting exists', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const mandatoryContributions = [
        MandatoryContribution.create({ assetType: 'insurance', value: 5000 }),
      ];

      const stockSubscriptions = [
        StockSubscription.create({
          memberId,
          stockId: 'stock-1',
          quantity: 5,
        }),
      ];

      const activeLoans = [
        Loan.create({
          memberId,
          loanType: 'personal',
          approvedAmount: 100000,
          monthlyPaymentAmount: 5000,
          interestRate: 0.02,
          term: 12,
        }),
      ];

      const stock1 = Stock.create({
        name: 'Type A',
        value: 10000,
        monthlyContribution: 2000,
        stockTypeId: '1',
      });

      findActiveSpy.mockResolvedValue(null); // No hay reunión activa
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue(mandatoryContributions);
      findActiveByMemberSpy.mockResolvedValue(stockSubscriptions);
      findActiveByMemberLoanSpy.mockResolvedValue(activeLoans);
      findByIdStockSpy.mockResolvedValue(stock1);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      expect(findActiveSpy).toHaveBeenCalledTimes(1);
      expect(findByIdMemberSpy).toHaveBeenCalledWith(memberId);
      expect(findByLoanAndMeetingSpy).not.toHaveBeenCalled(); // No se debe llamar sin meetingId
      expect(result).toHaveLength(3); // 1 mandatory + 1 stock + 1 loan

      // Verificar que se retornan todas las obligaciones
      const mandatoryDues = result.filter(
        (due) => due.type === PaymentType.MANDATORY_CONTRIBUTION,
      );
      expect(mandatoryDues).toHaveLength(1);

      const stockDues = result.filter(
        (due) => due.type === PaymentType.STOCK_FEE,
      );
      expect(stockDues).toHaveLength(1);

      // Sin reunión activa, todos los préstamos activos deben estar incluidos
      const loanDues = result.filter(
        (due) => due.type === PaymentType.LOAN_PAYMENT,
      );
      expect(loanDues).toHaveLength(1);
      expect(loanDues[0].referenceId).toBe(activeLoans[0].id);
    });

    it('should throw MemberNotFoundException when member does not exist', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(queryHandler.execute(memberId)).rejects.toThrow(
        MemberNotFoundException,
      );
      expect(findActiveSpy).toHaveBeenCalledTimes(1);
      expect(findByIdMemberSpy).toHaveBeenCalledWith(memberId);
    });

    it('should return empty array when member has no obligations', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue([]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      expect(result).toEqual([]);
    });

    it('should return only mandatory contributions with value greater than 0', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const mandatoryContributions = [
        MandatoryContribution.create({ assetType: 'insurance', value: 5000 }),
        MandatoryContribution.create({ assetType: 'fee', value: 10000 }),
      ];

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue(mandatoryContributions);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue([]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      expect(result).toHaveLength(2);
      const mandatoryDues = result.filter(
        (due) => due.type === PaymentType.MANDATORY_CONTRIBUTION,
      );
      expect(mandatoryDues).toHaveLength(2);
      expect(mandatoryDues[0].amount).toBeGreaterThan(0);
      expect(mandatoryDues[1].amount).toBeGreaterThan(0);
    });

    it('should return empty array when no active stock subscriptions', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue([]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const stockDues = result.filter(
        (due) => due.type === PaymentType.STOCK_FEE,
      );
      expect(stockDues).toHaveLength(0);
    });

    it('should filter out stocks with monthlyContribution 0', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const stockSubscriptions = [
        StockSubscription.create({
          memberId,
          stockId: 'stock-1',
          quantity: 5,
        }),
      ];

      const stock = Stock.create({
        name: 'Type A',
        value: 10000,
        monthlyContribution: 0, // Sin contribución mensual
        stockTypeId: '1',
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue(stockSubscriptions);
      findActiveByMemberLoanSpy.mockResolvedValue([]);
      findByIdStockSpy.mockResolvedValue(stock);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const stockDues = result.filter(
        (due) => due.type === PaymentType.STOCK_FEE,
      );
      expect(stockDues).toHaveLength(0);
    });

    it('should filter out loans that already have interest payment in active meeting', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const activeLoans = [
        Loan.create({
          memberId,
          loanType: 'personal',
          approvedAmount: 100000,
          monthlyPaymentAmount: 5000,
          interestRate: 0.02,
          term: 12,
        }),
      ];

      const interestPayment = LoanTransactionDetail.create({
        loanId: activeLoans[0].id,
        transactionType: LoanTransactionType.INTEREST_PAYMENT,
        amount: 2000,
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue(activeLoans);
      findByLoanAndMeetingSpy.mockResolvedValue([interestPayment]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const loanDues = result.filter(
        (due) => due.type === PaymentType.LOAN_PAYMENT,
      );
      expect(loanDues).toHaveLength(0);
      expect(findByLoanAndMeetingSpy).toHaveBeenCalledWith(
        [activeLoans[0].id],
        meetingId,
      );
    });

    it('should include loans without interest payment in active meeting', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const activeLoans = [
        Loan.create({
          memberId,
          loanType: 'personal',
          approvedAmount: 100000,
          monthlyPaymentAmount: 5000,
          interestRate: 0.02,
          term: 12,
        }),
      ];

      // Solo hay pago de principal, no de interés
      const principalPayment = LoanTransactionDetail.create({
        loanId: activeLoans[0].id,
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 5000,
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue(activeLoans);
      findByLoanAndMeetingSpy.mockResolvedValue([principalPayment]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const loanDues = result.filter(
        (due) => due.type === PaymentType.LOAN_PAYMENT,
      );
      expect(loanDues).toHaveLength(1);
      expect(loanDues[0].referenceId).toBe(activeLoans[0].id);
    });

    it('should filter out loans with outstandingBalance 0', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const loan = Loan.fromPersistence({
        id: 'loan-1',
        member_id: memberId,
        loan_type: 'personal',
        approved_amount: 100000,
        disbursed_amount: 100000,
        outstanding_balance: 0, // Balance en 0
        monthly_payment_amount: 5000,
        interest_rate: 0.02,
        term: 12,
        status: 'active',
        creation_date: new Date(),
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue([loan]);
      findByLoanAndMeetingSpy.mockResolvedValue([]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const loanDues = result.filter(
        (due) => due.type === PaymentType.LOAN_PAYMENT,
      );
      expect(loanDues).toHaveLength(0);
    });

    it('should handle multiple loans correctly', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const activeLoans = [
        Loan.create({
          memberId,
          loanType: 'personal',
          approvedAmount: 100000,
          monthlyPaymentAmount: 5000,
          interestRate: 0.02,
          term: 12,
        }),
        Loan.create({
          memberId,
          loanType: 'business',
          approvedAmount: 200000,
          monthlyPaymentAmount: 10000,
          interestRate: 0.015,
          term: 24,
        }),
      ];

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue(activeLoans);
      findByLoanAndMeetingSpy.mockResolvedValue([]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const loanDues = result.filter(
        (due) => due.type === PaymentType.LOAN_PAYMENT,
      );
      expect(loanDues).toHaveLength(2);
      expect(loanDues[0].description).toBe('Cuota préstamo: personal');
      expect(loanDues[1].description).toBe('Cuota préstamo: business');
    });

    it('should format creationDate correctly for loans', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const creationDate = new Date('2024-01-15T10:00:00Z');
      const loan = Loan.fromPersistence({
        id: 'loan-1',
        member_id: memberId,
        loan_type: 'personal',
        approved_amount: 100000,
        disbursed_amount: 100000,
        outstanding_balance: 50000,
        monthly_payment_amount: 5000,
        interest_rate: 0.02,
        term: 12,
        status: 'active',
        creation_date: creationDate,
      });

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue([]);
      findActiveByMemberLoanSpy.mockResolvedValue([loan]);
      findByLoanAndMeetingSpy.mockResolvedValue([]);

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const loanDues = result.filter(
        (due) => due.type === PaymentType.LOAN_PAYMENT,
      );
      expect(loanDues).toHaveLength(1);
      expect(loanDues[0].creationDate).toBe('2024-01-15');
    });

    it('should handle stock not found gracefully', async () => {
      // ARRANGE
      const activeMeeting = Meeting.fromPersistence({
        id: meetingId,
        date: new Date(),
        status: 'active',
      });

      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const stockSubscriptions = [
        StockSubscription.create({
          memberId,
          stockId: 'stock-not-found',
          quantity: 5,
        }),
      ];

      findActiveSpy.mockResolvedValue(activeMeeting);
      findByIdMemberSpy.mockResolvedValue(member);
      findAllMandatorySpy.mockResolvedValue([]);
      findActiveByMemberSpy.mockResolvedValue(stockSubscriptions);
      findActiveByMemberLoanSpy.mockResolvedValue([]);
      findByIdStockSpy.mockResolvedValue(null); // Stock no encontrado

      // ACT
      const result: MemberDueResponseDto[] =
        await queryHandler.execute(memberId);

      // ASSERT
      const stockDues = result.filter(
        (due) => due.type === PaymentType.STOCK_FEE,
      );
      expect(stockDues).toHaveLength(0);
    });
  });
});
