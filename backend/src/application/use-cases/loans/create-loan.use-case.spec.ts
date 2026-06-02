import { CreateLoanUseCase } from './create-loan.use-case';
import { CreateLoanDto } from '@application/dto/loans/create-loan.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  LOANS_RECEIVABLE_ACCOUNT,
  CASH_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
} from '@domain/constants/account-types';

describe('CreateLoanUseCase', () => {
  let useCase: CreateLoanUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;

  let memberFindByIdSpy: jest.SpyInstance;
  let meetingFindByIdSpy: jest.SpyInstance;
  let loanSaveSpy: jest.SpyInstance;
  let loanTransactionDetailSaveSpy: jest.SpyInstance;
  let pendingMemberPaymentSaveSpy: jest.SpyInstance;
  let recordOperationExecuteSpy: jest.SpyInstance;

  const mockMemberId = 'member-id-1';
  const mockMeetingId = 'meeting-id-1';
  const mockMember = Member.create({
    name: 'John Doe',
    email: 'john.doe@example.com',
    identificationNumber: '1234567890',
  });
  const mockMeeting = Meeting.create({
    date: new Date('2024-01-15'),
    notes: 'Test meeting',
  });

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
    };

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

    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new CreateLoanUseCase(
      memberRepository,
      meetingRepository,
      loanRepository,
      loanTransactionDetailRepository,
      pendingMemberPaymentRepository,
      recordOperationUseCase,
    );

    // Setup default mocks
    memberFindByIdSpy = jest
      .spyOn(memberRepository, 'findById')
      .mockResolvedValue(mockMember);
    meetingFindByIdSpy = jest
      .spyOn(meetingRepository, 'findById')
      .mockResolvedValue(mockMeeting);
    recordOperationExecuteSpy = jest
      .spyOn(recordOperationUseCase, 'execute')
      .mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: ['ledger-entry-1', 'ledger-entry-2'],
      });
    loanSaveSpy = jest.spyOn(loanRepository, 'save');
    loanTransactionDetailSaveSpy = jest.spyOn(
      loanTransactionDetailRepository,
      'save',
    );
    pendingMemberPaymentSaveSpy = jest.spyOn(
      pendingMemberPaymentRepository,
      'save',
    );
  });

  describe('Successful loan creation', () => {
    it('should create a loan of type "accion" successfully', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'accion',
        approvedAmount: 10000,
        monthlyPaymentAmount: 0,
        interestRate: 0.02,
        term: 24,
      };

      const savedLoan = Loan.create({
        memberId: dto.memberId,
        loanType: dto.loanType,
        approvedAmount: dto.approvedAmount,
        monthlyPaymentAmount: dto.monthlyPaymentAmount,
        interestRate: dto.interestRate,
        term: dto.term,
      });
      savedLoan.update({
        disbursedAmount: dto.approvedAmount,
        outstandingBalance: dto.approvedAmount,
        status: LoanStatus.ACTIVE,
      });

      loanSaveSpy.mockResolvedValue(savedLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});
      pendingMemberPaymentSaveSpy.mockResolvedValue({});

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        loanId: savedLoan.id,
        operationId: 'operation-id-1',
        status: LoanStatus.ACTIVE,
        disbursedAmount: 10000,
      });

      expect(memberFindByIdSpy).toHaveBeenCalledWith(mockMemberId);
      expect(meetingFindByIdSpy).toHaveBeenCalledWith(mockMeetingId);
      expect(loanSaveSpy).toHaveBeenCalled();
      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: OperationType.LOAN_DISBURSEMENT,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: 10000,
            }),
            expect.objectContaining({
              accountType: MEMBER_EQUITY_ACCOUNT,
              amount: -10000,
            }),
          ]),
        }),
      );
      expect(loanTransactionDetailSaveSpy).toHaveBeenCalled();
      expect(pendingMemberPaymentSaveSpy).not.toHaveBeenCalled();
    });

    it('should create a loan of type "corriente" successfully', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 20,
      };

      const savedLoan = Loan.create({
        memberId: dto.memberId,
        loanType: dto.loanType,
        approvedAmount: dto.approvedAmount,
        monthlyPaymentAmount: dto.monthlyPaymentAmount,
        interestRate: dto.interestRate,
        term: dto.term,
      });
      savedLoan.update({
        disbursedAmount: dto.approvedAmount,
        outstandingBalance: dto.approvedAmount,
        status: LoanStatus.ACTIVE,
      });

      loanSaveSpy.mockResolvedValue(savedLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        loanId: savedLoan.id,
        operationId: 'operation-id-1',
        status: LoanStatus.ACTIVE,
        disbursedAmount: 5000,
      });

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: -5000,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: 5000,
            }),
          ]),
        }),
      );
    });

    it('should create a loan of type "agil" successfully', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'agil',
        approvedAmount: 3000,
        monthlyPaymentAmount: 150,
        interestRate: 0.025,
        term: 20,
      };

      const savedLoan = Loan.create({
        memberId: dto.memberId,
        loanType: dto.loanType,
        approvedAmount: dto.approvedAmount,
        monthlyPaymentAmount: dto.monthlyPaymentAmount,
        interestRate: dto.interestRate,
        term: dto.term,
      });
      savedLoan.update({
        disbursedAmount: dto.approvedAmount,
        outstandingBalance: dto.approvedAmount,
        status: LoanStatus.ACTIVE,
      });

      loanSaveSpy.mockResolvedValue(savedLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        loanId: savedLoan.id,
        operationId: 'operation-id-1',
        status: LoanStatus.ACTIVE,
        disbursedAmount: 3000,
      });

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: -3000,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: 3000,
            }),
          ]),
        }),
      );
    });

    it('should create PendingMemberPayment when disbursement is partial', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.03,
        term: 20,
        disbursedAmount: 5000, // Partial disbursement
      };

      const savedLoan = Loan.create({
        memberId: dto.memberId,
        loanType: dto.loanType,
        approvedAmount: dto.approvedAmount,
        monthlyPaymentAmount: dto.monthlyPaymentAmount,
        interestRate: dto.interestRate,
        term: dto.term,
      });
      savedLoan.update({
        disbursedAmount: dto.disbursedAmount!,
        outstandingBalance: dto.disbursedAmount!, // outstanding_balance debe ser igual al monto desembolsado
        status: LoanStatus.PENDING,
      });

      loanSaveSpy.mockResolvedValue(savedLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});
      pendingMemberPaymentSaveSpy.mockResolvedValue({});

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        loanId: savedLoan.id,
        operationId: 'operation-id-1',
        status: LoanStatus.PENDING,
        disbursedAmount: 5000,
      });

      expect(pendingMemberPaymentSaveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          amount: 5000, // pending amount
          loanId: savedLoan.id,
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('should throw MemberNotFoundException when member does not exist', async () => {
      const dto: CreateLoanDto = {
        memberId: 'non-existent-member',
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 20,
      };

      memberFindByIdSpy.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        MemberNotFoundException,
      );
    });

    it('should throw MeetingNotFoundException when meeting does not exist', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: 'non-existent-meeting',
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 20,
      };

      meetingFindByIdSpy.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        MeetingNotFoundException,
      );
    });

    it('should throw InvalidRequestError when meeting is closed', async () => {
      const closedMeeting = Meeting.create({
        date: new Date('2024-01-15'),
        notes: 'Closed meeting',
      });
      closedMeeting.close();

      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 20,
      };

      meetingFindByIdSpy.mockResolvedValue(closedMeeting);

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when approvedAmount is zero or negative', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 0,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 20,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when interestRate is zero or negative', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0,
        term: 20,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when monthlyPaymentAmount is negative', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: -100,
        interestRate: 0.03,
        term: 20,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when term is zero or negative', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 0,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when disbursedAmount exceeds approvedAmount', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 20,
        disbursedAmount: 6000,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when disbursedAmount is negative', async () => {
      const dto: CreateLoanDto = {
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        loanType: 'corriente',
        approvedAmount: 5000,
        monthlyPaymentAmount: 250,
        interestRate: 0.03,
        term: 20,
        disbursedAmount: -1000,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });
  });
});
