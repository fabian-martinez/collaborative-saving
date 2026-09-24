/* eslint-disable @typescript-eslint/unbound-method */
import { GetLoanTransactionsQueryHandler } from './get-loan-transactions.query-handler';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { Loan } from '@domain/entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';

describe('GetLoanTransactionsQueryHandler', () => {
  let queryHandler: GetLoanTransactionsQueryHandler;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;

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

    loanTransactionDetailRepository = {
      findById: jest.fn(),
      findByLoan: jest.fn(),
      findByLoanWithPagination: jest.fn(),
      findByLoans: jest.fn(),
      findByLoanAndMeeting: jest.fn(),
      findByLoansAndMeeting: jest.fn(),
      findByOperationIds: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    };

    queryHandler = new GetLoanTransactionsQueryHandler(
      loanRepository,
      loanTransactionDetailRepository,
    );
  });

  it('should throw LoanNotFoundException when loan does not exist', async () => {
    const loanId = 'non-existent-loan-id';
    loanRepository.findById.mockResolvedValue(null);

    await expect(
      queryHandler.execute({ loanId, page: 1, limit: 10 }),
    ).rejects.toThrow(LoanNotFoundException);

    expect(loanRepository.findById).toHaveBeenCalledWith(loanId);
  });

  it('should return paginated transactions when loan exists', async () => {
    const loanId = 'loan-id-1';
    const loan = Loan.create({
      memberId: 'member-1',
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    const transaction1 = LoanTransactionDetail.create({
      loanId,
      transactionType: LoanTransactionType.DISBURSEMENT,
      amount: 1000000,
      notes: 'Desembolso inicial',
    });

    const transaction2 = LoanTransactionDetail.create({
      loanId,
      transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
      amount: 150000,
      notes: 'Primer pago',
    });

    loanRepository.findById.mockResolvedValue(loan);
    loanTransactionDetailRepository.findByLoanWithPagination.mockResolvedValue({
      data: [transaction1, transaction2],
      total: 2,
    });

    const result = await queryHandler.execute({ loanId, page: 1, limit: 10 });

    expect(loanRepository.findById).toHaveBeenCalledWith(loanId);
    expect(
      loanTransactionDetailRepository.findByLoanWithPagination,
    ).toHaveBeenCalledWith(loanId, { page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      id: transaction1.id,
      loanId: transaction1.loanId,
      transactionType: 'disbursement',
      amount: 1000000,
      notes: 'Desembolso inicial',
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it('should use default values for page and limit', async () => {
    const loanId = 'loan-id-1';
    const loan = Loan.create({
      memberId: 'member-1',
      loanType: 'corriente',
      approvedAmount: 1000000,
      monthlyPaymentAmount: 150000,
      interestRate: 0.05,
      term: 12,
    });

    loanRepository.findById.mockResolvedValue(loan);
    loanTransactionDetailRepository.findByLoanWithPagination.mockResolvedValue({
      data: [],
      total: 0,
    });

    await queryHandler.execute({ loanId });

    expect(
      loanTransactionDetailRepository.findByLoanWithPagination,
    ).toHaveBeenCalledWith(loanId, { page: 1, limit: 10 });
  });
});
