import { GetLoanDetailQueryHandler } from './get-loan-detail.query-handler';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';

describe('GetLoanDetailQueryHandler', () => {
  let queryHandler: GetLoanDetailQueryHandler;
  let loanRepository: jest.Mocked<LoanRepository>;
  let findByIdSpy: jest.SpyInstance;

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

    findByIdSpy = jest.spyOn(loanRepository, 'findById');

    queryHandler = new GetLoanDetailQueryHandler(loanRepository);
  });

  it('should throw LoanNotFoundException when loan does not exist', async () => {
    const loanId = 'non-existent-loan-id';
    findByIdSpy.mockResolvedValue(null);

    await expect(queryHandler.execute(loanId)).rejects.toThrow(
      LoanNotFoundException,
    );
    expect(findByIdSpy).toHaveBeenCalledWith(loanId);
  });

  it('should return loan details when loan exists', async () => {
    const loanId = 'loan-id-1';
    const loan = Loan.create({
      memberId: 'member-1',
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    findByIdSpy.mockResolvedValue(loan);

    const result = await queryHandler.execute(loanId);

    expect(findByIdSpy).toHaveBeenCalledWith(loanId);
    expect(result).toEqual({
      id: loan.id,
      memberId: loan.memberId,
      loanType: loan.loanType,
      approvedAmount: loan.approvedAmount,
      disbursedAmount: loan.disbursedAmount,
      outstandingBalance: loan.outstandingBalance,
      monthlyPaymentAmount: loan.monthlyPaymentAmount,
      interestRate: loan.interestRate,
      term: loan.term,
      status: loan.status,
      creationDate: loan.creationDate,
      guaranteedStockId: loan.guaranteedStockId,
    });
  });

  it('should map all loan fields correctly including optional fields', async () => {
    const loanId = 'loan-id-1';
    const loan = Loan.create({
      memberId: 'member-1',
      loanType: 'accion',
      approvedAmount: 2000000,
      monthlyPaymentAmount: 200000,
      interestRate: 0.04,
      term: 18,
      guaranteedStockId: 'stock-1',
    });

    findByIdSpy.mockResolvedValue(loan);

    const result = await queryHandler.execute(loanId);

    expect(result).toMatchObject({
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
    expect(result.creationDate).toBeInstanceOf(Date);
  });
});
