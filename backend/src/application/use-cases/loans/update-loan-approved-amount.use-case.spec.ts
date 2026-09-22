import { UpdateLoanApprovedAmountUseCase } from './update-loan-approved-amount.use-case';
import { UpdateLoanApprovedAmountDto } from '@application/dto/loans/update-loan-approved-amount.dto';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { EventBus } from '@domain/ports/services/event-bus.port';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { LoanApprovedAmountChangedEvent } from '@domain/events/loan-approved-amount-changed.event';

describe('UpdateLoanApprovedAmountUseCase', () => {
  let useCase: UpdateLoanApprovedAmountUseCase;
  let loanRepository: jest.Mocked<LoanRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let eventBus: jest.Mocked<EventBus>;

  let findLoanByIdSpy: jest.SpyInstance;
  let saveLoanSpy: jest.SpyInstance;
  let findActiveMeetingSpy: jest.SpyInstance;
  let findPaymentsByMemberSpy: jest.SpyInstance;
  let savePaymentSpy: jest.SpyInstance;
  let deletePaymentSpy: jest.SpyInstance;
  let publishSpy: jest.SpyInstance;

  const mockLoanId = 'loan-id-1';
  const mockMemberId = 'member-id-1';
  const mockMeetingId = 'meeting-id-1';

  beforeEach(() => {
    loanRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    };

    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      findByReference: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      calculateRemainingAmount: jest.fn(),
      findWithFilters: jest.fn(),
      delete: jest.fn(),
    };

    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    };

    transactionManager = {
      execute: jest.fn(async (callback: () => Promise<unknown>) => {
        return await callback();
      }),
    } as unknown as jest.Mocked<TransactionManager>;

    eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    findLoanByIdSpy = jest.spyOn(loanRepository, 'findById');
    saveLoanSpy = jest.spyOn(loanRepository, 'save');
    findActiveMeetingSpy = jest.spyOn(meetingRepository, 'findActive');
    findPaymentsByMemberSpy = jest.spyOn(
      pendingMemberPaymentRepository,
      'findByMember',
    );
    savePaymentSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
    deletePaymentSpy = jest.spyOn(pendingMemberPaymentRepository, 'delete');
    publishSpy = jest.spyOn(eventBus, 'publish');

    useCase = new UpdateLoanApprovedAmountUseCase(
      loanRepository,
      pendingMemberPaymentRepository,
      meetingRepository,
      transactionManager,
      eventBus,
    );
  });

  it('should throw LoanNotFoundException when loan does not exist', async () => {
    const dto: UpdateLoanApprovedAmountDto = {
      loanId: mockLoanId,
      newApprovedAmount: 8000,
    };

    findLoanByIdSpy.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(LoanNotFoundException);
    expect(findLoanByIdSpy).toHaveBeenCalledWith(mockLoanId);
    expect(saveLoanSpy).not.toHaveBeenCalled();
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('should throw BusinessRuleError when there is no active meeting', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 10000,
      monthlyPaymentAmount: 500,
      interestRate: 0.02,
      term: 24,
    });

    const dto: UpdateLoanApprovedAmountDto = {
      loanId: loan.id,
      newApprovedAmount: 8000,
    };

    findLoanByIdSpy.mockResolvedValue(loan);
    findActiveMeetingSpy.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(BusinessRuleError);
    expect(findActiveMeetingSpy).toHaveBeenCalled();
    expect(saveLoanSpy).not.toHaveBeenCalled();
  });

  it('should update approved amount and delete pending payment when remaining balance is 0', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 10000,
      monthlyPaymentAmount: 500,
      interestRate: 0.02,
      term: 24,
    });
    // Simular que ya se desembolsó 5000 y el estado es consistente
    loan.update({
      disbursedAmount: 5000,
      outstandingBalance: 5000,
      status: LoanStatus.PENDING,
    });

    const meeting = Meeting.fromPersistence({
      id: mockMeetingId,
      date: new Date(),
      status: 'active',
      notes: 'Active meeting',
      created_at: new Date(),
    });

    const pendingPayment = PendingMemberPayment.create({
      memberId: mockMemberId,
      meetingId: mockMeetingId,
      type: PendingMemberPaymentType.LOAN,
      amount: 5000, // remanente original (10000 - 5000)
      loanId: loan.id,
    });

    const dto: UpdateLoanApprovedAmountDto = {
      loanId: loan.id,
      newApprovedAmount: 5000, // Reducir al monto desembolsado ($5000)
      changedBy: 'user-admin-1',
    };

    findLoanByIdSpy.mockResolvedValue(loan);
    findActiveMeetingSpy.mockResolvedValue(meeting);
    saveLoanSpy.mockImplementation((l: Loan) => Promise.resolve(l));
    findPaymentsByMemberSpy.mockResolvedValue([pendingPayment]);
    deletePaymentSpy.mockResolvedValue(undefined);

    await useCase.execute(dto);

    expect(loan.approvedAmount).toBe(5000);
    expect(loan.disbursedAmount).toBe(5000);
    expect(loan.status).toBe('active'); // Debería pasar a activo automáticamente

    expect(saveLoanSpy).toHaveBeenCalledTimes(1);
    expect(deletePaymentSpy).toHaveBeenCalledWith(pendingPayment.id);
    expect(savePaymentSpy).not.toHaveBeenCalled();
    expect(publishSpy).toHaveBeenCalledTimes(1);

    const publishCalls = publishSpy.mock.calls as unknown as [
      LoanApprovedAmountChangedEvent,
    ][];
    const publishedEvent = publishCalls[0][0];
    expect(publishedEvent).toBeInstanceOf(LoanApprovedAmountChangedEvent);
    expect(publishedEvent.payload.loanId).toBe(loan.id);
    expect(publishedEvent.payload.previousApprovedAmount).toBe(10000);
    expect(publishedEvent.payload.newApprovedAmount).toBe(5000);
  });

  it('should update approved amount and update pending payment amount when remaining balance is > 0', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 10000,
      monthlyPaymentAmount: 500,
      interestRate: 0.02,
      term: 24,
    });
    loan.update({
      disbursedAmount: 3000,
      outstandingBalance: 3000,
      status: LoanStatus.PENDING,
    });

    const meeting = Meeting.fromPersistence({
      id: mockMeetingId,
      date: new Date(),
      status: 'active',
      notes: 'Active meeting',
      created_at: new Date(),
    });

    const pendingPayment = PendingMemberPayment.create({
      memberId: mockMemberId,
      meetingId: mockMeetingId,
      type: PendingMemberPaymentType.LOAN,
      amount: 7000, // remanente original (10000 - 3000)
      loanId: loan.id,
    });

    const dto: UpdateLoanApprovedAmountDto = {
      loanId: loan.id,
      newApprovedAmount: 8000, // Ajustar approvedAmount a $8000 (remanente = 5000)
      changedBy: 'user-admin-1',
    };

    findLoanByIdSpy.mockResolvedValue(loan);
    findActiveMeetingSpy.mockResolvedValue(meeting);
    saveLoanSpy.mockImplementation((l: Loan) => Promise.resolve(l));
    findPaymentsByMemberSpy.mockResolvedValue([pendingPayment]);
    savePaymentSpy.mockImplementation((p: PendingMemberPayment) =>
      Promise.resolve(p),
    );

    await useCase.execute(dto);

    expect(loan.approvedAmount).toBe(8000);
    expect(loan.disbursedAmount).toBe(3000);
    expect(loan.status).toBe('pending');

    expect(saveLoanSpy).toHaveBeenCalledTimes(1);
    expect(deletePaymentSpy).not.toHaveBeenCalled();
    expect(savePaymentSpy).toHaveBeenCalledTimes(1);
    expect(pendingPayment.amount).toBe(5000); // 8000 - 3000
    expect(publishSpy).toHaveBeenCalledTimes(1);
  });

  it('should update approved amount and create pending payment when none existed', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 5000,
      monthlyPaymentAmount: 500,
      interestRate: 0.02,
      term: 10,
    });
    // Simular que ya se desembolsó completo
    loan.update({
      disbursedAmount: 5000,
      outstandingBalance: 5000,
      status: LoanStatus.ACTIVE,
    });

    const meeting = Meeting.fromPersistence({
      id: mockMeetingId,
      date: new Date(),
      status: 'active',
      notes: 'Active meeting',
      created_at: new Date(),
    });

    const dto: UpdateLoanApprovedAmountDto = {
      loanId: loan.id,
      newApprovedAmount: 7000, // Ampliar approvedAmount a $7000 (remanente = 2000)
      changedBy: 'user-admin-1',
    };

    findLoanByIdSpy.mockResolvedValue(loan);
    findActiveMeetingSpy.mockResolvedValue(meeting);
    saveLoanSpy.mockImplementation((l: Loan) => Promise.resolve(l));
    findPaymentsByMemberSpy.mockResolvedValue([]); // Ningún pago pendiente activo
    savePaymentSpy.mockImplementation((p: PendingMemberPayment) =>
      Promise.resolve(p),
    );

    await useCase.execute(dto);

    expect(loan.approvedAmount).toBe(7000);
    expect(loan.disbursedAmount).toBe(5000);
    expect(loan.status).toBe('pending'); // Pasa a pendiente porque ya no está completamente desembolsado

    expect(saveLoanSpy).toHaveBeenCalledTimes(1);
    expect(savePaymentSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        amount: 2000, // 7000 - 5000
        type: PendingMemberPaymentType.LOAN,
        loanId: loan.id,
        notes: 'Saldo pendiente de préstamo (Ajustado)',
      }),
    );
  });
});
