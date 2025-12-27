import { GetMemberLoansQueryHandler } from './get-member-loans.query-handler';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';

describe('GetMemberLoansQueryHandler', () => {
  let queryHandler: GetMemberLoansQueryHandler;
  let loanRepository: jest.Mocked<LoanRepository>;
  let findByMemberSpy: jest.SpyInstance;

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

    findByMemberSpy = jest.spyOn(loanRepository, 'findByMember');

    queryHandler = new GetMemberLoansQueryHandler(loanRepository);
  });

  it('should return empty array when member has no loans', async () => {
    const memberId = 'member-1';
    findByMemberSpy.mockResolvedValue([]);

    const result = await queryHandler.execute(memberId);

    expect(findByMemberSpy).toHaveBeenCalledWith(memberId);
    expect(result).toEqual([]);
  });

  it('should return all loans for a member', async () => {
    const memberId = 'member-1';
    const loan1 = Loan.create({
      memberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });
    const loan2 = Loan.create({
      memberId,
      loanType: 'agil',
      approvedAmount: 500000,
      monthlyPaymentAmount: 75000,
      interestRate: 0.06,
      term: 10,
    });

    findByMemberSpy.mockResolvedValue([loan1, loan2]);

    const result = await queryHandler.execute(memberId);

    expect(findByMemberSpy).toHaveBeenCalledWith(memberId);
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

  it('should return loans with different statuses', async () => {
    const memberId = 'member-1';
    const activeLoan = Loan.create({
      memberId,
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });
    activeLoan.update({ status: LoanStatus.ACTIVE });

    const paidLoan = Loan.create({
      memberId,
      loanType: 'agil',
      approvedAmount: 500000,
      monthlyPaymentAmount: 75000,
      interestRate: 0.06,
      term: 10,
    });
    paidLoan.update({ status: LoanStatus.PAID });

    findByMemberSpy.mockResolvedValue([activeLoan, paidLoan]);

    const result = await queryHandler.execute(memberId);

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe(LoanStatus.ACTIVE);
    expect(result[1].status).toBe(LoanStatus.PAID);
  });
});

