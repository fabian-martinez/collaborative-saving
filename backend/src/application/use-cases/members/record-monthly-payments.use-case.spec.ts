import { RecordMonthlyPaymentsUseCase } from './record-monthly-payments.use-case';
import { RecordMonthlyPaymentsDto } from '@application/dto/members/record-monthly-payments.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Loan } from '@domain/entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidPaymentException } from '@application/exceptions/invalid-payment.exception';
import { DuplicateMonthlyPaymentException } from '@application/exceptions/duplicate-monthly-payment.exception';
import { PaymentType } from '@application/dto/members/payment-item.dto';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Operation } from '@domain/entities/operation.entity';

describe('RecordMonthlyPaymentsUseCase', () => {
  let useCase: RecordMonthlyPaymentsUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let findByIdSpy: jest.SpyInstance;
  let findActiveSpy: jest.SpyInstance;
  let loanFindByIdSpy: jest.SpyInstance;
  let loanSaveSpy: jest.SpyInstance;
  let loanTransactionDetailSaveSpy: jest.SpyInstance;
  let findByMemberSpy: jest.SpyInstance;
  let recordOperationExecuteSpy: jest.SpyInstance;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

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

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    findByIdSpy = jest.spyOn(memberRepository, 'findById');
    findActiveSpy = jest.spyOn(meetingRepository, 'findActive');
    loanFindByIdSpy = jest.spyOn(loanRepository, 'findById');
    loanSaveSpy = jest.spyOn(loanRepository, 'save');
    loanTransactionDetailSaveSpy = jest.spyOn(
      loanTransactionDetailRepository,
      'save',
    );
    findByMemberSpy = jest.spyOn(operationRepository, 'findByMember');
    recordOperationExecuteSpy = jest.spyOn(recordOperationUseCase, 'execute');

    // Default: no existing payments
    findByMemberSpy.mockResolvedValue([]);

    useCase = new RecordMonthlyPaymentsUseCase(
      memberRepository,
      meetingRepository,
      loanRepository,
      loanTransactionDetailRepository,
      operationRepository,
      recordOperationUseCase,
    );
  });

  describe('execute', () => {
    const validDto: RecordMonthlyPaymentsDto = {
      memberId: 'member-id',
      payments: [
        {
          type: PaymentType.STOCK_FEE,
          amount: 100,
          description: 'Cuota de acciones',
        },
        {
          type: PaymentType.MANDATORY_CONTRIBUTION,
          amount: 50,
          description: 'Aporte obligatorio',
        },
      ],
    };

    const mockMember = Member.create({
      name: 'Test Member',
      email: 'test@example.com',
    });

    const mockMeeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    it('should record payments successfully with multiple payment types', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2', 'entry-3'],
      });

      // ACT
      const result = await useCase.execute(validDto);

      // ASSERT
      expect(findByIdSpy).toHaveBeenCalledWith('member-id');
      expect(findActiveSpy).toHaveBeenCalledTimes(1);
      expect(recordOperationExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result.operationId).toBe('operation-id');
      expect(result.memberId).toBe('member-id');
      expect(result.meetingId).toBe(mockMeeting.id);
      expect(result.ledgerEntryIds).toEqual(['entry-1', 'entry-2', 'entry-3']);
    });

    it('should throw MemberNotFoundException when member does not exist', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(useCase.execute(validDto)).rejects.toThrow(
        MemberNotFoundException,
      );
      expect(findByIdSpy).toHaveBeenCalledWith('member-id');
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });

    it('should throw MeetingNotFoundException when no active meeting exists', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(useCase.execute(validDto)).rejects.toThrow(
        MeetingNotFoundException,
      );
      expect(findActiveSpy).toHaveBeenCalledTimes(1);
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });

    it('should use provided meetingId when available', async () => {
      // ARRANGE
      const dtoWithMeeting: RecordMonthlyPaymentsDto = {
        ...validDto,
        meetingId: 'specific-meeting-id',
      };
      const findMeetingByIdSpy = jest.spyOn(meetingRepository, 'findById');
      findByIdSpy.mockResolvedValue(mockMember);
      findMeetingByIdSpy.mockResolvedValue(mockMeeting);
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      });

      // ACT
      const result = await useCase.execute(dtoWithMeeting);

      // ASSERT
      expect(findMeetingByIdSpy).toHaveBeenCalledWith('specific-meeting-id');
      expect(findActiveSpy).not.toHaveBeenCalled();
      expect(result.meetingId).toBe(mockMeeting.id);
    });

    it('should calculate correct total amount', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      });

      // ACT
      const result = await useCase.execute(validDto);

      // ASSERT
      expect(result.totalAmount).toBe(150); // 100 + 50
    });

    it('should validate positive amounts', async () => {
      // ARRANGE
      const invalidDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.STOCK_FEE,
            amount: -100,
            description: 'Invalid amount',
          },
        ],
      };
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);

      // ACT & ASSERT
      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        InvalidPaymentException,
      );
    });

    it('should process loan payment and update loan balance', async () => {
      // ARRANGE
      const loanId = 'loan-id';
      const loanDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.LOAN_PAYMENT,
            amount: 500,
            description: 'Loan payment',
            referenceId: loanId,
          },
        ],
      };

      const mockLoan = Loan.create({
        memberId: 'member-id',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      mockLoan.update({ outstandingBalance: 5000 });

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue(
        LoanTransactionDetail.create({
          loanId: loanId,
          transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
          amount: 500,
          operationId: 'operation-id',
        }),
      );
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      });

      // ACT
      const result = await useCase.execute(loanDto);

      // ASSERT
      expect(findByIdSpy).toHaveBeenCalledWith('member-id');
      expect(loanFindByIdSpy).toHaveBeenCalledWith(loanId);
      expect(loanFindByIdSpy).toHaveBeenCalledTimes(2); // Once for validation, once for processing
      expect(loanSaveSpy).toHaveBeenCalledTimes(1);
      expect(loanTransactionDetailSaveSpy).toHaveBeenCalledTimes(1);
      expect(mockLoan.outstandingBalance).toBe(4500); // 5000 - 500
      expect(result.operationId).toBe('operation-id');
      expect(result.totalAmount).toBe(500);
    });

    it('should throw LoanNotFoundException when loan does not exist', async () => {
      // ARRANGE
      const loanDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.LOAN_PAYMENT,
            amount: 500,
            referenceId: 'non-existent-loan',
          },
        ],
      };

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      loanFindByIdSpy.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(useCase.execute(loanDto)).rejects.toThrow(
        LoanNotFoundException,
      );
      expect(loanFindByIdSpy).toHaveBeenCalledWith('non-existent-loan');
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });

    it('should throw InvalidPaymentException when loan payment has no referenceId', async () => {
      // ARRANGE
      const invalidDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.LOAN_PAYMENT,
            amount: 500,
            // Missing referenceId
          },
        ],
      };

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);

      // ACT & ASSERT
      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        InvalidPaymentException,
      );
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });

    it('should throw DuplicateMonthlyPaymentException when member already has a monthly payment for this meeting', async () => {
      // ARRANGE
      const existingPayment = Operation.create({
        memberId: 'member-id',
        meetingId: mockMeeting.id,
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Existing monthly payment',
      });

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      findByMemberSpy.mockResolvedValue([existingPayment]);

      // ACT & ASSERT
      await expect(useCase.execute(validDto)).rejects.toThrow(
        DuplicateMonthlyPaymentException,
      );
      expect(findByMemberSpy).toHaveBeenCalledWith('member-id', {
        meetingId: mockMeeting.id,
        types: [OperationType.MONTHLY_PAYMENT],
      });
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });
  });
});
