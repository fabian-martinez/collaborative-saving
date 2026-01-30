import { CalculateMemberInsuranceUseCase } from './calculate-member-insurance.use-case';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';

describe('CalculateMemberInsuranceUseCase', () => {
  const memberId = 'member-1';

  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let useCase: CalculateMemberInsuranceUseCase;

  beforeEach(() => {
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
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      findGuaranteed: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    useCase = new CalculateMemberInsuranceUseCase(
      stockSubscriptionRepository,
      loanRepository,
      stockRepository,
    );
  });

  function createStock(params: { id: string; value: number }): Stock {
    return Stock.fromPersistence({
      id: params.id,
      name: 'Type A',
      value: params.value,
      monthly_contribution: 0,
      is_guaranteed: false,
      guaranteed_yield: null,
    });
  }

  function createSubscription(params: {
    id: string;
    stockId: string;
    quantity: number;
    financingLoanId?: string | null;
  }): StockSubscription {
    return StockSubscription.fromPersistence({
      id: params.id,
      member_id: memberId,
      stock_id: params.stockId,
      quantity: params.quantity,
      status: 'active',
      purchase_date: new Date('2024-01-01'),
      financing_loan_id:
        params.financingLoanId === undefined ? null : params.financingLoanId,
    });
  }

  function createLoan(params: {
    id: string;
    outstandingBalance: number;
    status?: LoanStatus;
  }): Loan {
    return Loan.fromPersistence({
      id: params.id,
      member_id: memberId,
      loan_type: 'standard',
      approved_amount: params.outstandingBalance,
      disbursed_amount: params.outstandingBalance,
      outstanding_balance: params.outstandingBalance,
      monthly_payment_amount: 100000,
      interest_rate: 0.01,
      term: 12,
      status: params.status ?? LoanStatus.ACTIVE,
      creation_date: new Date('2024-01-01'),
      guaranteed_stock_id: null,
    });
  }

  it('should calculate insurance when debt is greater than savings', async () => {
    const stockId = 'stock-1';
    const loanId = 'loan-1';

    stockSubscriptionRepository.findByMember.mockResolvedValue([
      createSubscription({ id: 'sub-1', stockId, quantity: 1 }),
    ]);

    loanRepository.findActiveByMember.mockResolvedValue([
      createLoan({ id: loanId, outstandingBalance: 100000 }),
    ]);

    stockRepository.findById.mockResolvedValue(
      createStock({ id: stockId, value: 50000 }),
    );

    const result = await useCase.execute({ memberId });

    expect(result.insuranceAmount).toBe(50);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(stockRepository.findById).toHaveBeenCalledWith(stockId);
  });

  it('should return zero when savings cover the debt', async () => {
    const stockId = 'stock-1';

    stockSubscriptionRepository.findByMember.mockResolvedValue([
      createSubscription({ id: 'sub-1', stockId, quantity: 2 }),
    ]);

    loanRepository.findActiveByMember.mockResolvedValue([
      createLoan({ id: 'loan-1', outstandingBalance: 50000 }),
    ]);

    stockRepository.findById.mockResolvedValue(
      createStock({ id: stockId, value: 30000 }),
    );

    const result = await useCase.execute({ memberId });

    expect(result.insuranceAmount).toBe(0);
  });

  it('should deduct capitalPayment from the debt base', async () => {
    const stockId = 'stock-1';

    stockSubscriptionRepository.findByMember.mockResolvedValue([
      createSubscription({ id: 'sub-1', stockId, quantity: 1 }),
    ]);

    loanRepository.findActiveByMember.mockResolvedValue([
      createLoan({ id: 'loan-1', outstandingBalance: 100000 }),
    ]);

    stockRepository.findById.mockResolvedValue(
      createStock({ id: stockId, value: 30000 }),
    );

    const result = await useCase.execute({ memberId, capitalPayment: 20000 });

    expect(result.insuranceAmount).toBe(50);
  });

  it('should exclude active financing loans from debt and savings', async () => {
    const stockId = 'stock-1';
    const financingLoanId = 'loan-financing';

    stockSubscriptionRepository.findByMember.mockResolvedValue([
      createSubscription({
        id: 'sub-1',
        stockId,
        quantity: 1,
        financingLoanId,
      }),
    ]);

    loanRepository.findActiveByMember.mockResolvedValue([
      createLoan({ id: 'loan-regular', outstandingBalance: 80000 }),
      createLoan({ id: financingLoanId, outstandingBalance: 50000 }),
    ]);

    stockRepository.findById.mockResolvedValue(
      createStock({ id: stockId, value: 40000 }),
    );

    const result = await useCase.execute({ memberId });

    // Only the regular loan should remain in debt (80k) and no savings from the financed stock
    expect(result.insuranceAmount).toBe(80);
  });
});
