import { GetPortfolioStatusQueryHandler } from './get-portfolio-status.query-handler';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { Loan } from '@domain/entities/loan.entity';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';
import { LoanStatus } from '@domain/enums/loan-status.enum';

describe('GetPortfolioStatusQueryHandler', () => {
  let handler: GetPortfolioStatusQueryHandler;
  let loanRepository: jest.Mocked<LoanRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;

  beforeEach(() => {
    loanRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    pendingMemberPaymentRepository = {
      findWithFilters: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      findByReference: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      calculateRemainingAmount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    handler = new GetPortfolioStatusQueryHandler(
      loanRepository,
      pendingMemberPaymentRepository,
    );
  });

  it('should calculate portfolio status correctly', async () => {
    const mockLoans: Partial<Loan>[] = [
      { id: 'loan-active-1', status: LoanStatus.ACTIVE },
      { id: 'loan-active-2', status: LoanStatus.ACTIVE },
      { id: 'loan-active-3', status: LoanStatus.ACTIVE },
      { id: 'loan-defaulted-1', status: LoanStatus.DEFAULTED },
      { id: 'loan-paid-1', status: LoanStatus.PAID },
    ];

    const mockPendingPayments: Partial<PendingMemberPayment>[] = [
      { id: 'payment-1', loanId: 'loan-active-1', status: 'pending' },
      { id: 'payment-2', loanId: 'loan-active-2', status: 'pending' },
    ];

    loanRepository.findAll.mockResolvedValue(mockLoans as Loan[]);

    pendingMemberPaymentRepository.findWithFilters.mockImplementation(
      (filters) => {
        if (filters.status === 'pending' && filters.type === 'LOAN_PAYMENT') {
          return Promise.resolve(mockPendingPayments as PendingMemberPayment[]);
        }
        return Promise.resolve([]);
      },
    );

    const result = await handler.execute();

    expect(result.upToDate).toBe(1); // loan-active-3
    expect(result.overdue).toBe(2); // loan-active-1, loan-active-2
    expect(result.writtenOff).toBe(1); // loan-defaulted-1
  });

  it('should handle no loans', async () => {
    loanRepository.findAll.mockResolvedValue([]);
    pendingMemberPaymentRepository.findWithFilters.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result.upToDate).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.writtenOff).toBe(0);
  });
});
