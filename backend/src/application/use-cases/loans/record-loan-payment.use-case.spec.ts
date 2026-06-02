import { RecordLoanPaymentUseCase } from './record-loan-payment.use-case';
import { RecordLoanPaymentDto } from '@application/dto/loans/record-loan-payment.dto';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
} from '@domain/constants/account-types';

describe('RecordLoanPaymentUseCase', () => {
  let useCase: RecordLoanPaymentUseCase;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;

  let loanFindByIdSpy: jest.SpyInstance;
  let loanSaveSpy: jest.SpyInstance;
  let loanTransactionDetailSaveSpy: jest.SpyInstance;
  let recordOperationExecuteSpy: jest.SpyInstance;

  const mockMeetingId = 'meeting-id-1';
  const mockMemberId = 'member-id-1';

  const createMockLoan = (
    options: {
      outstandingBalance?: number;
      interestRate?: number;
      status?: LoanStatus;
    } = {},
  ): Loan => {
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: 10000,
      monthlyPaymentAmount: 500,
      interestRate: options.interestRate ?? 0.02,
      term: 24,
    });
    loan.update({
      disbursedAmount: 10000,
      outstandingBalance: options.outstandingBalance ?? 10000,
      status: options.status ?? LoanStatus.ACTIVE,
    });
    return loan;
  };

  beforeEach(() => {
    loanRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    loanTransactionDetailRepository = {
      findById: jest.fn(),
      findByLoan: jest.fn(),
      findByLoanAndMeeting: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMemberAndStock: jest.fn(),
      findByMemberAndStockAndNoLoan: jest.fn(),
      findByFinancingLoan: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    transactionManager = {
      execute: jest.fn(async <T>(operation: () => Promise<T>): Promise<T> => {
        return await operation();
      }),
      getActiveQueryRunner: jest.fn(),
    } as unknown as jest.Mocked<TransactionManager>;

    useCase = new RecordLoanPaymentUseCase(
      loanRepository,
      loanTransactionDetailRepository,
      recordOperationUseCase,
      stockSubscriptionRepository,
      transactionManager,
    );

    // Setup default mocks
    recordOperationExecuteSpy = jest
      .spyOn(recordOperationUseCase, 'execute')
      .mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: ['ledger-entry-1', 'ledger-entry-2', 'ledger-entry-3'],
      });
    loanFindByIdSpy = jest.spyOn(loanRepository, 'findById');
    jest
      .spyOn(stockSubscriptionRepository, 'findByFinancingLoan')
      .mockResolvedValue([]);
    loanSaveSpy = jest.spyOn(loanRepository, 'save');
    loanTransactionDetailSaveSpy = jest.spyOn(
      loanTransactionDetailRepository,
      'save',
    );
  });

  describe('Successful payment recording', () => {
    it('should record a payment with automatic interest/principal calculation', async () => {
      const mockLoan = createMockLoan({
        outstandingBalance: 10000,
        interestRate: 0.02,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
        notes: 'Monthly payment',
      };

      const result = await useCase.execute(dto);

      // Interest due = 10000 * 0.02 = 200
      const expectedInterest = 200;
      const expectedPrincipal = 300;

      expect(result).toEqual({
        loanId: mockLoan.id,
        operationId: 'operation-id-1',
        interestPaid: expectedInterest,
        principalPaid: expectedPrincipal,
        newOutstandingBalance: 10000 - expectedPrincipal,
        loanStatus: LoanStatus.ACTIVE,
        transactionDetailIds: expect.any(Array) as string[],
      });

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: OperationType.LOAN_PAYMENT,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: 500,
            }),
            expect.objectContaining({
              accountType: INTEREST_INCOME_ACCOUNT,
              amount: -expectedInterest,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: -expectedPrincipal,
            }),
          ]),
        }),
      );

      // Should create 2 transaction details (interest + principal)
      expect(loanTransactionDetailSaveSpy).toHaveBeenCalledTimes(2);
    });

    it('should record a payment with forced principal amount (no interest)', async () => {
      const mockLoan = createMockLoan({ outstandingBalance: 5000 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 1000,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: 1000,
        notes: 'Stock-based payment (all principal)',
      };

      const result = await useCase.execute(dto);

      expect(result.interestPaid).toBe(0);
      expect(result.principalPaid).toBe(1000);
      expect(result.newOutstandingBalance).toBe(4000);

      // Should only create 1 transaction detail (principal only)
      expect(loanTransactionDetailSaveSpy).toHaveBeenCalledTimes(1);
    });

    it('should record a payment with forced amounts', async () => {
      const mockLoan = createMockLoan({ outstandingBalance: 10000 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
        forcedInterestAmount: 150,
        forcedPrincipalAmount: 350,
      };

      const result = await useCase.execute(dto);

      expect(result.interestPaid).toBe(150);
      expect(result.principalPaid).toBe(350);
    });

    it('should mark loan as paid when balance reaches zero', async () => {
      const mockLoan = createMockLoan({
        outstandingBalance: 500,
        interestRate: 0.02,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});
      jest
        .spyOn(stockSubscriptionRepository, 'findByFinancingLoan')
        .mockResolvedValue([]);

      // Interest due = 500 * 0.02 = 10
      // Principal = 500 - 10 = 490
      // We need to pay exactly 500 + 10 = 510 to pay off the loan
      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 510,
        forcedInterestAmount: 10,
        forcedPrincipalAmount: 500,
      };

      const result = await useCase.execute(dto);

      expect(result.newOutstandingBalance).toBe(0);
      expect(result.loanStatus).toBe(LoanStatus.PAID);
    });

    it('should handle payment with only interest (no principal)', async () => {
      const mockLoan = createMockLoan({
        outstandingBalance: 10000,
        interestRate: 0.02,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      // Payment of 100 when interest due is 200 -> all goes to interest
      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.interestPaid).toBe(100);
      expect(result.principalPaid).toBe(0);
      expect(result.newOutstandingBalance).toBe(10000); // No change in principal

      // Should only create 1 transaction detail (interest only)
      expect(loanTransactionDetailSaveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should throw LoanNotFoundException when loan does not exist', async () => {
      loanFindByIdSpy.mockResolvedValue(null);

      const dto: RecordLoanPaymentDto = {
        loanId: 'non-existent-loan',
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(LoanNotFoundException);
    });

    it('should throw InvalidRequestError when payment amount is zero', async () => {
      const mockLoan = createMockLoan();
      loanFindByIdSpy.mockResolvedValue(mockLoan);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 0,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when payment amount is negative', async () => {
      const mockLoan = createMockLoan();
      loanFindByIdSpy.mockResolvedValue(mockLoan);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: -100,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when principal exceeds outstanding balance', async () => {
      const mockLoan = createMockLoan({ outstandingBalance: 500 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 1000,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: 1000, // Exceeds balance of 500
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when forced amounts do not match total', async () => {
      const mockLoan = createMockLoan();
      loanFindByIdSpy.mockResolvedValue(mockLoan);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
        forcedInterestAmount: 100,
        forcedPrincipalAmount: 300, // 100 + 300 = 400, not 500
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });
  });

  describe('Description building', () => {
    it('should use custom notes when provided', async () => {
      const mockLoan = createMockLoan();
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
        notes: 'Custom payment description',
      };

      await useCase.execute(dto);

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Custom payment description',
        }),
      );
    });

    it('should generate description when notes not provided', async () => {
      const mockLoan = createMockLoan({ interestRate: 0.02 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      loanTransactionDetailSaveSpy.mockResolvedValue({});

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
      };

      await useCase.execute(dto);

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Pago de préstamo') as string,
        }),
      );
    });
  });
});
