import { GetLoansQueryHandler } from './get-loans.query-handler';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';

describe('GetLoansQueryHandler', () => {
  let queryHandler: GetLoansQueryHandler;
  let loanRepository: jest.Mocked<LoanRepository>;
  let findAllSpy: jest.SpyInstance;

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

    findAllSpy = jest.spyOn(loanRepository, 'findAll');

    queryHandler = new GetLoansQueryHandler(loanRepository);
  });

  it('should return empty array when no loans exist', async () => {
    findAllSpy.mockResolvedValue([]);

    const result = await queryHandler.execute();

    expect(findAllSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('should return list of loans', async () => {
    const loan1 = Loan.create({
      memberId: 'member-1',
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });
    const loan2 = Loan.create({
      memberId: 'member-2',
      loanType: 'agil',
      approvedAmount: 500000,
      monthlyPaymentAmount: 75000,
      interestRate: 0.06,
      term: 10,
    });

    findAllSpy.mockResolvedValue([loan1, loan2]);

    const result = await queryHandler.execute();

    expect(findAllSpy).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: loan1.id,
      memberId: loan1.memberId,
      loanType: loan1.loanType,
      approvedAmount: loan1.approvedAmount,
      disbursedAmount: loan1.disbursedAmount,
      outstandingBalance: loan1.outstandingBalance,
      monthlyPaymentAmount: loan1.monthlyPaymentAmount,
      interestRate: loan1.interestRate,
      term: loan1.term,
      status: loan1.status,
      creationDate: loan1.creationDate,
      guaranteedStockId: loan1.guaranteedStockId,
    });
    expect(result[1]).toEqual({
      id: loan2.id,
      memberId: loan2.memberId,
      loanType: loan2.loanType,
      approvedAmount: loan2.approvedAmount,
      disbursedAmount: loan2.disbursedAmount,
      outstandingBalance: loan2.outstandingBalance,
      monthlyPaymentAmount: loan2.monthlyPaymentAmount,
      interestRate: loan2.interestRate,
      term: loan2.term,
      status: loan2.status,
      creationDate: loan2.creationDate,
      guaranteedStockId: loan2.guaranteedStockId,
    });
  });

  it('should map all loan fields correctly', async () => {
    const loan = Loan.create({
      memberId: 'member-1',
      loanType: 'accion',
      approvedAmount: 2000000,
      monthlyPaymentAmount: 200000,
      interestRate: 0.04,
      term: 18,
      guaranteedStockId: 'stock-1',
    });

    findAllSpy.mockResolvedValue([loan]);

    const result = await queryHandler.execute();

    expect(result[0]).toMatchObject({
      id: loan.id,
      memberId: 'member-1',
      loanType: 'accion',
      approvedAmount: 2000000,
      disbursedAmount: 0,
      outstandingBalance: 2000000,
      monthlyPaymentAmount: 200000,
      interestRate: 0.04,
      term: 18,
      status: LoanStatus.PENDING,
      guaranteedStockId: 'stock-1',
    });
    expect(result[0].creationDate).toBeInstanceOf(Date);
  });
});

