import { UpdateLoanTermsUseCase } from './update-loan-terms.use-case';
import { UpdateLoanTermsDto } from '@application/dto/loans/update-loan-terms.dto';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { EventBus } from '@domain/ports/services/event-bus.port';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { LoanTermsChangedEvent } from '@domain/events/loan-terms-changed.event';

describe('UpdateLoanTermsUseCase', () => {
  let useCase: UpdateLoanTermsUseCase;
  let loanRepository: jest.Mocked<LoanRepository>;
  let eventBus: jest.Mocked<EventBus>;

  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let publishSpy: jest.SpyInstance;

  const mockLoanId = 'loan-id-1';
  const mockMemberId = 'member-id-1';

  beforeEach(() => {
    loanRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    findByIdSpy = jest.spyOn(loanRepository, 'findById');
    saveSpy = jest.spyOn(loanRepository, 'save');
    publishSpy = jest.spyOn(eventBus, 'publish');

    useCase = new UpdateLoanTermsUseCase(loanRepository, eventBus);
  });

  it('should throw LoanNotFoundException when loan does not exist', async () => {
    const dto: UpdateLoanTermsDto = {
      loanId: mockLoanId,
      interestRate: 0.06,
    };

    findByIdSpy.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(LoanNotFoundException);
    expect(findByIdSpy).toHaveBeenCalledWith(mockLoanId);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('should update interest rate and emit event', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      interestRate: 0.06,
    };

    findByIdSpy.mockResolvedValue(loan);
    saveSpy.mockImplementation(async (l) => l);

    const result = await useCase.execute(dto);

    expect(findByIdSpy).toHaveBeenCalledWith(loan.id);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.interestRate).toBe(0.06);
    expect(result.monthlyPaymentAmount).toBe(150000); // Unchanged
    expect(result.term).toBe(12); // Unchanged

    // Verify event was published
    expect(publishSpy).toHaveBeenCalledTimes(1);
    const publishedEvent = publishSpy.mock.calls[0][0] as LoanTermsChangedEvent;
    expect(publishedEvent).toBeInstanceOf(LoanTermsChangedEvent);
    expect(publishedEvent.payload.loanId).toBe(loan.id);
    expect(publishedEvent.payload.previousTerms.interestRate).toBe(0.05);
    expect(publishedEvent.payload.newTerms.interestRate).toBe(0.06);
  });

  it('should update monthly payment amount and emit event', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      monthlyPaymentAmount: 160000,
    };

    findByIdSpy.mockResolvedValue(loan);
    saveSpy.mockImplementation(async (l) => l);

    const result = await useCase.execute(dto);

    expect(result.monthlyPaymentAmount).toBe(160000);
    expect(result.interestRate).toBe(0.05); // Unchanged
    expect(result.term).toBe(12); // Unchanged

    expect(publishSpy).toHaveBeenCalledTimes(1);
    const publishedEvent = publishSpy.mock.calls[0][0] as LoanTermsChangedEvent;
    expect(publishedEvent.payload.previousTerms.monthlyPaymentAmount).toBe(
      150000,
    );
    expect(publishedEvent.payload.newTerms.monthlyPaymentAmount).toBe(160000);
  });

  it('should update term and emit event', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      term: 18,
    };

    findByIdSpy.mockResolvedValue(loan);
    saveSpy.mockImplementation(async (l) => l);

    const result = await useCase.execute(dto);

    expect(result.term).toBe(18);
    expect(result.interestRate).toBe(0.05); // Unchanged
    expect(result.monthlyPaymentAmount).toBe(150000); // Unchanged

    expect(publishSpy).toHaveBeenCalledTimes(1);
    const publishedEvent = publishSpy.mock.calls[0][0] as LoanTermsChangedEvent;
    expect(publishedEvent.payload.previousTerms.term).toBe(12);
    expect(publishedEvent.payload.newTerms.term).toBe(18);
  });

  it('should update multiple terms at once', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      interestRate: 0.06,
      monthlyPaymentAmount: 160000,
      term: 18,
    };

    findByIdSpy.mockResolvedValue(loan);
    saveSpy.mockImplementation(async (l) => l);

    const result = await useCase.execute(dto);

    expect(result.interestRate).toBe(0.06);
    expect(result.monthlyPaymentAmount).toBe(160000);
    expect(result.term).toBe(18);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    const publishedEvent = publishSpy.mock.calls[0][0] as LoanTermsChangedEvent;
    expect(publishedEvent.payload.previousTerms).toEqual({
      interestRate: 0.05,
      monthlyPaymentAmount: 150000,
      term: 12,
    });
    expect(publishedEvent.payload.newTerms).toEqual({
      interestRate: 0.06,
      monthlyPaymentAmount: 160000,
      term: 18,
    });
  });

  it('should not emit event when no changes are made', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      interestRate: 0.05, // Same value
      monthlyPaymentAmount: 150000, // Same value
      term: 12, // Same value
    };

    findByIdSpy.mockResolvedValue(loan);
    saveSpy.mockImplementation(async (l) => l);

    const result = await useCase.execute(dto);

    expect(result.interestRate).toBe(0.05);
    expect(result.monthlyPaymentAmount).toBe(150000);
    expect(result.term).toBe(12);

    // Event should not be published when no changes
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('should include changedBy in event payload when provided', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const userId = 'admin-user-id';
    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      interestRate: 0.06,
      changedBy: userId,
    };

    findByIdSpy.mockResolvedValue(loan);
    saveSpy.mockImplementation(async (l) => l);

    await useCase.execute(dto);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    const publishedEvent = publishSpy.mock.calls[0][0] as LoanTermsChangedEvent;
    expect(publishedEvent.payload.changedBy).toBe(userId);
  });

  it('should throw error when interest rate is invalid', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      interestRate: 1.5, // Invalid: > 1
    };

    findByIdSpy.mockResolvedValue(loan);

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Interest rate must be between 0 and 1',
    );
  });

  it('should throw error when monthly payment amount is negative', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      monthlyPaymentAmount: -100,
    };

    findByIdSpy.mockResolvedValue(loan);

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Monthly payment amount cannot be negative',
    );
  });

  it('should throw error when term is less than 1', async () => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const dto: UpdateLoanTermsDto = {
      loanId: loan.id,
      term: 0,
    };

    findByIdSpy.mockResolvedValue(loan);

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Loan term must be >= 1',
    );
  });
});
