import { GetPortfolioStatusQueryHandler } from './get-portfolio-status.query-handler';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { Loan } from '@domain/entities/loan.entity';
import { LoanType } from '@domain/entities/loan-type.entity';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';
import { LoanStatus } from '@domain/enums/loan-status.enum';

describe('GetPortfolioStatusQueryHandler', () => {
  let handler: GetPortfolioStatusQueryHandler;
  let loanRepository: jest.Mocked<LoanRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let loanTypeRepository: jest.Mocked<LoanTypeRepository>;

  beforeEach(() => {
    loanRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    };

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
    };

    loanTypeRepository = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    handler = new GetPortfolioStatusQueryHandler(
      loanRepository,
      pendingMemberPaymentRepository,
      loanTypeRepository,
    );
  });

  it('should calculate portfolio status and distribution by loan type correctly', async () => {
    const mockLoans: Partial<Loan>[] = [
      {
        id: 'loan-active-1',
        status: LoanStatus.ACTIVE,
        loanType: 'corriente',
        outstandingBalance: 1000000,
      },
      {
        id: 'loan-active-2',
        status: LoanStatus.ACTIVE,
        loanType: 'corriente',
        outstandingBalance: 500000,
      },
      {
        id: 'loan-active-3',
        status: LoanStatus.ACTIVE,
        loanType: 'agil',
        outstandingBalance: 300000,
      },
      {
        id: 'loan-defaulted-1',
        status: LoanStatus.DEFAULTED,
        loanType: 'corriente',
        outstandingBalance: 200000,
      },
      {
        id: 'loan-paid-1',
        status: LoanStatus.PAID,
        loanType: 'agil',
        outstandingBalance: 0,
      },
    ];

    const mockPendingPayments: Partial<PendingMemberPayment>[] = [
      { id: 'payment-1', loanId: 'loan-active-1', status: 'pending' },
      { id: 'payment-2', loanId: 'loan-active-2', status: 'pending' },
    ];

    loanRepository.findAll.mockResolvedValue(mockLoans as Loan[]);
    loanTypeRepository.findAll.mockResolvedValue([
      { code: 'corriente', name: 'Corriente' } as LoanType,
      { code: 'agil', name: 'Ágil' } as LoanType,
    ]);

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
    expect(result.byType).toEqual([
      {
        loanType: 'corriente',
        name: 'Corriente',
        count: 2,
        totalAmount: 1500000,
      },
      {
        loanType: 'agil',
        name: 'Ágil',
        count: 1,
        totalAmount: 300000,
      },
    ]);
  });

  it('should handle no loans', async () => {
    loanRepository.findAll.mockResolvedValue([]);
    pendingMemberPaymentRepository.findWithFilters.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result.upToDate).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.writtenOff).toBe(0);
    expect(result.byType).toEqual([]);
  });

  it('should fallback to capitalized code or "otro" when loanTypeRepository is omitted or type is unknown', async () => {
    const handlerWithoutLoanTypeRepo = new GetPortfolioStatusQueryHandler(
      loanRepository,
      pendingMemberPaymentRepository,
    );

    const mockLoans: Partial<Loan>[] = [
      {
        id: 'loan-1',
        status: LoanStatus.ACTIVE,
        loanType: 'especial',
        outstandingBalance: 400000,
      },
      {
        id: 'loan-2',
        status: LoanStatus.ACTIVE,
        loanType: '',
        outstandingBalance: 100000,
      },
    ];

    loanRepository.findAll.mockResolvedValue(mockLoans as Loan[]);
    pendingMemberPaymentRepository.findWithFilters.mockResolvedValue([]);

    const result = await handlerWithoutLoanTypeRepo.execute();

    expect(result.byType).toEqual([
      {
        loanType: 'especial',
        name: 'Especial',
        count: 1,
        totalAmount: 400000,
      },
      {
        loanType: 'otro',
        name: 'Otro',
        count: 1,
        totalAmount: 100000,
      },
    ]);
  });
});
