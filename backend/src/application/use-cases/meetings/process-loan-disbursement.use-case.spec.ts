import { ProcessLoanDisbursementUseCase } from './process-loan-disbursement.use-case';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { NotFoundError } from '@domain/errors/not-found.error';

describe('ProcessLoanDisbursementUseCase', () => {
  let useCase: ProcessLoanDisbursementUseCase;
  let loanRepository: jest.Mocked<LoanRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let createLoanUseCase: jest.Mocked<CreateLoanUseCase>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;

  const mockMemberId = 'member-id-1';
  const mockMeetingId = 'meeting-id-1';
  const mockLoanId = 'loan-id-1';
  const mockMember = Member.create({
    name: 'John Doe',
    email: 'john.doe@example.com',
  });
  const mockMeeting = Meeting.create({
    date: new Date('2024-01-15'),
    notes: 'Test meeting',
  });

  beforeEach(() => {
    loanRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    loanTransactionDetailRepository = {
      findById: jest.fn(),
      findByLoan: jest.fn(),
      findByLoanAndMeeting: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

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

    createLoanUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateLoanUseCase>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new ProcessLoanDisbursementUseCase(
      loanRepository,
      pendingMemberPaymentRepository,
      loanTransactionDetailRepository,
      memberRepository,
      meetingRepository,
      createLoanUseCase,
      recordOperationUseCase,
    );
  });

  describe('execute', () => {
    describe('when processing new loan request', () => {
      it('should create new loan using CreateLoanUseCase when newLoanRequest is provided', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          newLoanRequest: {
            memberId: mockMemberId,
            amount: 10000,
            loanType: 'corriente',
            approvedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          },
        };

        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        createLoanUseCase.execute.mockResolvedValue({
          loanId: 'loan-id-1',
          operationId: 'operation-id-1',
          status: 'active',
          disbursedAmount: 10000,
        });

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 10000,
        });

        // Assert
        expect(result).toBe(10000);
        const findMemberByIdSpy = jest.spyOn(memberRepository, 'findById');
        const findMeetingByIdSpy = jest.spyOn(meetingRepository, 'findById');
        const executeLoanSpy = jest.spyOn(createLoanUseCase, 'execute');
        expect(findMemberByIdSpy).toHaveBeenCalledWith(mockMemberId);
        expect(findMeetingByIdSpy).toHaveBeenCalledWith(mockMeetingId);
        expect(executeLoanSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            memberId: mockMemberId,
            meetingId: mockMeetingId,
            loanType: 'corriente',
            approvedAmount: 10000,
            disbursedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          }),
        );
      });

      it('should convert prioritario loan type to corriente for CreateLoanUseCase', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          newLoanRequest: {
            memberId: mockMemberId,
            amount: 10000,
            loanType: 'prioritario',
            approvedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          },
        };

        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        createLoanUseCase.execute.mockResolvedValue({
          loanId: 'loan-id-1',
          operationId: 'operation-id-1',
          status: 'active',
          disbursedAmount: 10000,
        });

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 10000,
        });

        // Assert
        expect(result).toBe(10000);
        const executeSpy = jest.spyOn(createLoanUseCase, 'execute');
        expect(executeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            loanType: 'corriente',
          }),
        );
      });

      it('should throw MemberNotFoundException when member not found for new loan', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          newLoanRequest: {
            memberId: mockMemberId,
            amount: 10000,
            loanType: 'corriente',
            approvedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          },
        };

        memberRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 10000,
          }),
        ).rejects.toThrow(MemberNotFoundException);
      });

      it('should throw MeetingNotFoundException when meeting not found for new loan', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          newLoanRequest: {
            memberId: mockMemberId,
            amount: 10000,
            loanType: 'corriente',
            approvedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          },
        };

        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 10000,
          }),
        ).rejects.toThrow(MeetingNotFoundException);
      });

      it('should throw BusinessRuleError for invalid loan type', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          newLoanRequest: {
            memberId: mockMemberId,
            amount: 10000,
            loanType: 'invalid' as 'corriente',
            approvedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          },
        };

        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 10000,
          }),
        ).rejects.toThrow(BusinessRuleError);
      });

      it('should calculate term correctly when monthly payment is provided', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          newLoanRequest: {
            memberId: mockMemberId,
            amount: 10000,
            loanType: 'corriente',
            approvedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          },
        };

        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        createLoanUseCase.execute.mockResolvedValue({
          loanId: 'loan-id-1',
          operationId: 'operation-id-1',
          status: 'active',
          disbursedAmount: 10000,
        });

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 10000,
        });

        // Assert
        expect(result).toBe(10000);
        const executeLoanSpy = jest.spyOn(createLoanUseCase, 'execute');
        expect(executeLoanSpy).toHaveBeenCalled();
        const callArgs = executeLoanSpy.mock.calls[0][0];
        expect(callArgs.term).toEqual(expect.any(Number));
      });

      it('should use partial disbursement when availableCash is less than amount', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          newLoanRequest: {
            memberId: mockMemberId,
            amount: 10000,
            loanType: 'corriente',
            approvedAmount: 10000,
            monthlyPaymentAmount: 1000,
            interestRate: 12,
          },
        };

        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        createLoanUseCase.execute.mockResolvedValue({
          loanId: 'loan-id-1',
          operationId: 'operation-id-1',
          status: 'active',
          disbursedAmount: 5000,
        });

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        const executeLoanSpy = jest.spyOn(createLoanUseCase, 'execute');
        expect(executeLoanSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            disbursedAmount: 5000,
          }),
        );
      });
    });

    describe('when processing pending loan disbursement', () => {
      it('should process pending loan disbursement successfully', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        loanRepository.save.mockResolvedValue(mockLoan);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 5000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        const findLoanByIdSpy = jest.spyOn(loanRepository, 'findById');
        const saveLoanSpy = jest.spyOn(loanRepository, 'save');
        const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
        const saveDetailSpy = jest.spyOn(
          loanTransactionDetailRepository,
          'save',
        );
        expect(findLoanByIdSpy).toHaveBeenCalledWith(mockLoanId);
        expect(saveLoanSpy).toHaveBeenCalled();
        expect(executeOpSpy).toHaveBeenCalled();
        expect(saveDetailSpy).toHaveBeenCalled();
      });

      it('should throw LoanNotFoundException when loan not found', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 5000,
          }),
        ).rejects.toThrow(LoanNotFoundException);
      });

      it('should throw BusinessRuleError when loan status is not pending or active', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.DEFAULTED });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 5000,
          }),
        ).rejects.toThrow(BusinessRuleError);
      });

      it('should limit disbursement to remaining approved amount', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({
          status: LoanStatus.PENDING,
          disbursedAmount: 6000,
          outstandingBalance: 6000,
        });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        loanRepository.save.mockResolvedValue(mockLoan);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 4000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 10000,
        });

        // Assert
        expect(result).toBe(4000);
        const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
        expect(executeOpSpy).toHaveBeenCalled();
        const callArgs = executeOpSpy.mock.calls[0][0];
        expect(callArgs.entries).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              amount: 4000,
            }),
          ]),
        );
      });

      it('should limit disbursement to available cash', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 10000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        loanRepository.save.mockResolvedValue(mockLoan);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 3000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 3000,
        });

        // Assert
        expect(result).toBe(3000);
        const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
        expect(executeOpSpy).toHaveBeenCalled();
        const callArgs = executeOpSpy.mock.calls[0][0];
        expect(callArgs.entries).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              amount: 3000,
            }),
          ]),
        );
      });

      it('should throw BusinessRuleError when no cash available or remaining approved amount', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING, disbursedAmount: 10000 });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 0,
          }),
        ).rejects.toThrow(BusinessRuleError);
      });

      it('should handle pending member payment when provided', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const mockPendingPayment = PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
          pendingMemberPaymentId: 'pending-payment-id-1',
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        pendingMemberPaymentRepository.findById.mockResolvedValue(
          mockPendingPayment,
        );
        pendingMemberPaymentRepository.save.mockResolvedValue(
          mockPendingPayment,
        );
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        loanRepository.save.mockResolvedValue(mockLoan);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 5000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        const findPaymentByIdSpy = jest.spyOn(
          pendingMemberPaymentRepository,
          'findById',
        );
        const savePaymentSpy = jest.spyOn(
          pendingMemberPaymentRepository,
          'save',
        );
        expect(findPaymentByIdSpy).toHaveBeenCalledWith('pending-payment-id-1');
        expect(savePaymentSpy).toHaveBeenCalled();
      });

      it('should create new pending payment when loan is not fully disbursed', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        loanRepository.save.mockResolvedValue(mockLoan);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 5000,
          }),
        );
        pendingMemberPaymentRepository.save.mockResolvedValue(
          PendingMemberPayment.create({
            memberId: mockMemberId,
            meetingId: mockMeetingId,
            type: PendingMemberPaymentType.LOAN,
            amount: 5000,
            loanId: mockLoanId,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        const savePaymentSpy = jest.spyOn(
          pendingMemberPaymentRepository,
          'save',
        );
        expect(savePaymentSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: PendingMemberPaymentType.LOAN,
          }),
        );
      });

      it('should create ledger entries for corriente loan type', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        loanRepository.save.mockResolvedValue(mockLoan);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 5000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
        expect(executeOpSpy).toHaveBeenCalled();
        const callArgs = executeOpSpy.mock.calls[0][0];
        expect(callArgs.entries).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              accountType: 'CASH',
              amount: -5000,
            }),
            expect.objectContaining({
              accountType: 'LOANS_RECEIVABLE',
              amount: 5000,
            }),
          ]),
        );
      });

      it('should create ledger entries for accion loan type', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'accion',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        loanRepository.save.mockResolvedValue(mockLoan);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 5000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
        expect(executeOpSpy).toHaveBeenCalled();
        const callArgs = executeOpSpy.mock.calls[0][0];
        expect(callArgs.entries).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              accountType: 'LOANS_RECEIVABLE',
              amount: 5000,
            }),
            expect.objectContaining({
              accountType: 'MEMBER_EQUITY',
              amount: -5000,
            }),
          ]),
        );
      });

      it('should throw NotFoundError when pending payment not found', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
          pendingMemberPaymentId: 'pending-payment-id-1',
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        pendingMemberPaymentRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 5000,
          }),
        ).rejects.toThrow(NotFoundError);
      });

      it('should throw MemberNotFoundException when member not found for pending loan', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 5000,
          }),
        ).rejects.toThrow(MemberNotFoundException);
      });

      it('should throw MeetingNotFoundException when meeting not found for pending loan', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({ status: LoanStatus.PENDING });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 5000,
          }),
        ).rejects.toThrow(MeetingNotFoundException);
      });

      it('should update outstanding_balance when processing partial disbursement', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({
          status: LoanStatus.PENDING,
          disbursedAmount: 0,
          outstandingBalance: 0,
        });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 5000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        expect(mockLoan.disbursedAmount).toBe(5000);
        expect(mockLoan.outstandingBalance).toBe(5000); // Debe incrementarse con el desembolso
        const saveLoanSpy = jest.spyOn(loanRepository, 'save');
        expect(saveLoanSpy).toHaveBeenCalledWith(mockLoan);
      });

      it('should update outstanding_balance correctly with multiple partial disbursements', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        // Primer desembolso de 3000
        mockLoan.update({
          status: LoanStatus.ACTIVE,
          disbursedAmount: 3000,
          outstandingBalance: 3000,
        });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 4000,
          loanId: mockLoanId,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 4000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 4000,
        });

        // Assert
        expect(result).toBe(4000);
        expect(mockLoan.disbursedAmount).toBe(7000); // 3000 + 4000
        expect(mockLoan.outstandingBalance).toBe(7000); // 3000 + 4000 (incrementado)
        const saveLoanSpy = jest.spyOn(loanRepository, 'save');
        expect(saveLoanSpy).toHaveBeenCalledWith(mockLoan);
      });

      it('should create pending_member_payment with correct amount after partial disbursement', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        mockLoan.update({
          status: LoanStatus.PENDING,
          disbursedAmount: 0,
          outstandingBalance: 0,
        });

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
          loanId: mockLoan.id, // Usar el ID real del préstamo
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoan.id,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 5000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        });

        // Assert
        expect(result).toBe(5000);
        const savePendingPaymentSpy = jest.spyOn(
          pendingMemberPaymentRepository,
          'save',
        );
        expect(savePendingPaymentSpy).toHaveBeenCalled();
        // El último llamado debe ser el nuevo pending payment creado
        const savedPendingPayment =
          savePendingPaymentSpy.mock.calls[
            savePendingPaymentSpy.mock.calls.length - 1
          ][0];
        expect(savedPendingPayment.amount).toBe(5000); // approvedAmount (10000) - disbursedAmount (5000)
        expect(savedPendingPayment.loanId).toBe(mockLoan.id); // Debe usar el ID del préstamo
        expect(savedPendingPayment.type).toBe(PendingMemberPaymentType.LOAN);
      });

      it('should update pending_member_payment amount correctly after additional partial disbursement', async () => {
        // Arrange
        const mockLoan = Loan.create({
          memberId: mockMemberId,
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 1000,
          interestRate: 0.12,
          term: 12,
        });
        // Primer desembolso de 3000
        mockLoan.update({
          status: LoanStatus.ACTIVE,
          disbursedAmount: 3000,
          outstandingBalance: 3000,
        });

        const existingPendingPayment = PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.LOAN,
          amount: 7000, // Monto anterior: 10000 - 3000
          loanId: mockLoanId,
        });
        // Aprobar el pending payment para evitar el guardado adicional de aprobación
        existingPendingPayment.approve();

        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 2000,
          loanId: mockLoanId,
          pendingMemberPaymentId: existingPendingPayment.id,
        };

        loanRepository.findById.mockResolvedValue(mockLoan);
        pendingMemberPaymentRepository.findById.mockResolvedValue(
          existingPendingPayment,
        );
        memberRepository.findById.mockResolvedValue(mockMember);
        meetingRepository.findById.mockResolvedValue(mockMeeting);
        recordOperationUseCase.execute.mockResolvedValue({
          operationId: 'operation-id-1',
          ledgerEntryIds: ['entry-id-1', 'entry-id-2'],
        });
        loanTransactionDetailRepository.save.mockResolvedValue(
          LoanTransactionDetail.create({
            loanId: mockLoanId,
            transactionType: LoanTransactionType.DISBURSEMENT,
            amount: 2000,
          }),
        );

        // Act
        const result = await useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 2000,
        });

        // Assert
        expect(result).toBe(2000);
        // Después del desembolso: disbursedAmount = 5000, remaining = 5000
        const savePendingPaymentSpy = jest.spyOn(
          pendingMemberPaymentRepository,
          'save',
        );
        // Debe marcar el existente como paid (1) y crear uno nuevo con el monto correcto (2)
        expect(savePendingPaymentSpy).toHaveBeenCalledTimes(2);
        // El último llamado debe ser el nuevo pending payment
        const newPendingPayment = savePendingPaymentSpy.mock.calls[1][0];
        expect(newPendingPayment.amount).toBe(5000); // approvedAmount (10000) - disbursedAmount (5000)
      });
    });

    describe('when neither newLoanRequest nor loanId is provided', () => {
      it('should throw BusinessRuleError', async () => {
        // Arrange
        const item: DisbursementPlanItemDto = {
          memberId: mockMemberId,
          type: DisbursementType.LOAN,
          amount: 5000,
        };

        // Act & Assert
        await expect(
          useCase.execute({
            item,
            meetingId: mockMeetingId,
            availableCash: 5000,
          }),
        ).rejects.toThrow(BusinessRuleError);
      });
    });
  });
});
