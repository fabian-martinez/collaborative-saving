import { GetMemberPaymentScheduleQueryHandler } from './get-member-payment-schedule.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PaymentProjectionService } from '@domain/services/payment-projection.service';
import { Member } from '@domain/entities/member.entity';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

describe('GetMemberPaymentScheduleQueryHandler', () => {
  let queryHandler: GetMemberPaymentScheduleQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let paymentProjectionService: jest.Mocked<PaymentProjectionService>;

  beforeEach(() => {
    // Mock repositories
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    loanRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
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

    paymentProjectionService = {
      projectFuturePayments: jest.fn(),
      calculateNextPaymentDate: jest.fn(),
    } as unknown as jest.Mocked<PaymentProjectionService>;

    queryHandler = new GetMemberPaymentScheduleQueryHandler(
      memberRepository,
      loanRepository,
      loanTransactionDetailRepository,
      operationRepository,
      ledgerEntryRepository,
      paymentProjectionService,
    );
  });

  describe('execute', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '660e8400-e29b-41d4-a716-446655440001';
    const loanId = '770e8400-e29b-41d4-a716-446655440002';

    it('should throw error when member not found', async () => {
      // ARRANGE
      memberRepository.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        queryHandler.execute(memberId, { months: 12 }),
      ).rejects.toThrow(MemberNotFoundException);
    });

    it('should return empty schedule when member has no loans', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      memberRepository.findById.mockResolvedValue(member);
      loanRepository.findActiveByMember.mockResolvedValue([]);
      loanTransactionDetailRepository.findByLoan.mockResolvedValue([]);
      operationRepository.findByMember.mockResolvedValue([]);
      ledgerEntryRepository.findByOperations.mockResolvedValue([]);
      paymentProjectionService.projectFuturePayments.mockReturnValue([]);

      // ACT
      const result = await queryHandler.execute(memberId, { months: 12 });

      // ASSERT
      expect(result.memberId).toBe(memberId);
      expect(result.historicalPayments).toEqual([]);
      expect(result.projectedPayments).toEqual([]);
      expect(result.summary.totalPaid).toBe(0);
      expect(result.summary.totalPending).toBe(0);
      expect(result.summary.totalOutstandingBalance).toBe(0);
    });

    it('should return schedule with historical payments', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const loan = Loan.create({
        memberId,
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      const operation = Operation.fromPersistence({
        id: 'op-1',
        memberId: memberId,
        meetingId: meetingId,
        type: OperationType.LOAN_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Loan payment',
      });

      const interestEntry = LedgerEntry.fromPersistence({
        id: 'entry-1',
        operation_id: 'op-1',
        account_type: INTEREST_INCOME_ACCOUNT,
        amount: -10000,
        created_at: new Date(),
        description: 'Interest',
        loan_id: loanId,
        stock_id: null,
        mandatory_contribution_id: null,
        stock_subscription_id: null,
      });

      const principalEntry = LedgerEntry.fromPersistence({
        id: 'entry-2',
        operation_id: 'op-1',
        account_type: LOANS_RECEIVABLE_ACCOUNT,
        amount: -90000,
        created_at: new Date(),
        description: 'Principal',
        loan_id: loanId,
        stock_id: null,
        mandatory_contribution_id: null,
        stock_subscription_id: null,
      });

      memberRepository.findById.mockResolvedValue(member);
      loanRepository.findActiveByMember.mockResolvedValue([loan]);
      loanTransactionDetailRepository.findByLoan.mockResolvedValue([]);
      operationRepository.findByMember.mockResolvedValue([operation]);
      ledgerEntryRepository.findByOperations.mockResolvedValue([
        interestEntry,
        principalEntry,
      ]);
      paymentProjectionService.projectFuturePayments.mockReturnValue([]);

      // ACT
      const result = await queryHandler.execute(memberId, { months: 12 });

      // ASSERT
      expect(result.historicalPayments).toHaveLength(1);
      expect(result.historicalPayments[0].operationId).toBe('op-1');
      expect(result.historicalPayments[0].loanId).toBe(loanId);
      expect(result.historicalPayments[0].interestAmount).toBe(10000);
      expect(result.historicalPayments[0].principalAmount).toBe(90000);
      expect(result.historicalPayments[0].totalAmount).toBe(100000);
      expect(result.historicalPayments[0].status).toBe('paid');
      expect(result.summary.totalPaid).toBe(100000);
    });

    it('should return schedule with projected payments', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const loan = Loan.create({
        memberId,
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE, outstandingBalance: 800000 });

      const projection = {
        loanId: loan.id,
        loanType: 'personal',
        date: new Date('2024-02-15'),
        totalAmount: 100000,
        interestAmount: 8000,
        principalAmount: 92000,
        remainingBalance: 708000,
        paymentNumber: 2,
      };

      memberRepository.findById.mockResolvedValue(member);
      loanRepository.findActiveByMember.mockResolvedValue([loan]);
      loanTransactionDetailRepository.findByLoan.mockResolvedValue([]);
      operationRepository.findByMember.mockResolvedValue([]);
      paymentProjectionService.projectFuturePayments.mockReturnValue([
        projection,
      ]);

      // ACT
      const result = await queryHandler.execute(memberId, { months: 12 });

      // ASSERT
      expect(result.projectedPayments).toHaveLength(1);
      expect(result.projectedPayments[0].loanId).toBe(loan.id);
      expect(result.projectedPayments[0].type).toBe('projected');
      expect(result.projectedPayments[0].status).toBe('pending');
      expect(result.projectedPayments[0].totalAmount).toBe(100000);
      expect(result.projectedPayments[0].remainingBalance).toBe(708000);
      expect(result.summary.totalPending).toBe(100000);
      expect(result.summary.nextPaymentAmount).toBe(100000);
      expect(result.summary.totalOutstandingBalance).toBe(800000);
    });

    it('should handle member with multiple loans', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const loan1 = Loan.create({
        memberId,
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan1.update({ status: LoanStatus.ACTIVE, outstandingBalance: 500000 });

      const loan2 = Loan.create({
        memberId,
        loanType: 'business',
        approvedAmount: 2000000,
        monthlyPaymentAmount: 200000,
        interestRate: 0.015,
        term: 10,
      });
      loan2.update({ status: LoanStatus.ACTIVE, outstandingBalance: 1500000 });

      const projections = [
        {
          loanId: loan1.id,
          loanType: 'personal',
          date: new Date('2024-02-15'),
          totalAmount: 100000,
          interestAmount: 5000,
          principalAmount: 95000,
          remainingBalance: 405000,
          paymentNumber: 2,
        },
        {
          loanId: loan2.id,
          loanType: 'business',
          date: new Date('2024-02-20'),
          totalAmount: 200000,
          interestAmount: 22500,
          principalAmount: 177500,
          remainingBalance: 1322500,
          paymentNumber: 2,
        },
      ];

      memberRepository.findById.mockResolvedValue(member);
      loanRepository.findActiveByMember.mockResolvedValue([loan1, loan2]);
      loanTransactionDetailRepository.findByLoan.mockResolvedValue([]);
      operationRepository.findByMember.mockResolvedValue([]);
      paymentProjectionService.projectFuturePayments.mockReturnValue(
        projections,
      );

      // ACT
      const result = await queryHandler.execute(memberId, { months: 12 });

      // ASSERT
      expect(result.projectedPayments).toHaveLength(2);
      expect(result.summary.totalOutstandingBalance).toBe(2000000);
      expect(result.summary.totalPending).toBe(300000);
    });

    it('should use default months value when not provided', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const loan = Loan.create({
        memberId,
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      memberRepository.findById.mockResolvedValue(member);
      loanRepository.findActiveByMember.mockResolvedValue([loan]);
      loanTransactionDetailRepository.findByLoan.mockResolvedValue([]);
      operationRepository.findByMember.mockResolvedValue([]);
      paymentProjectionService.projectFuturePayments.mockReturnValue([]);

      // ACT
      await queryHandler.execute(memberId, {});

      // ASSERT
      expect(
        paymentProjectionService.projectFuturePayments.mock.calls,
      ).toHaveLength(1);
      expect(
        paymentProjectionService.projectFuturePayments.mock.calls[0][0],
      ).toEqual([loan]);
      expect(
        paymentProjectionService.projectFuturePayments.mock.calls[0][3],
      ).toBe(12); // Default value
    });

    it('should use custom months value when provided', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        status: 'active',
        role: 'member',
        registrationDate: new Date(),
      });

      const loan = Loan.create({
        memberId,
        loanType: 'personal',
        approvedAmount: 1000000,
        monthlyPaymentAmount: 100000,
        interestRate: 0.01,
        term: 12,
      });
      loan.update({ status: LoanStatus.ACTIVE });

      memberRepository.findById.mockResolvedValue(member);
      loanRepository.findActiveByMember.mockResolvedValue([loan]);
      loanTransactionDetailRepository.findByLoan.mockResolvedValue([]);
      operationRepository.findByMember.mockResolvedValue([]);
      paymentProjectionService.projectFuturePayments.mockReturnValue([]);

      // ACT
      await queryHandler.execute(memberId, { months: 24 });

      // ASSERT
      expect(
        paymentProjectionService.projectFuturePayments.mock.calls,
      ).toHaveLength(1);
      expect(
        paymentProjectionService.projectFuturePayments.mock.calls[0][0],
      ).toEqual([loan]);
      expect(
        paymentProjectionService.projectFuturePayments.mock.calls[0][3],
      ).toBe(24);
    });
  });
});
