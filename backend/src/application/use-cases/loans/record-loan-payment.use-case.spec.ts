import { RecordLoanPaymentUseCase } from './record-loan-payment.use-case';
import { RecordLoanPaymentDto } from '@application/dto/loans/record-loan-payment.dto';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { LoanTransactionType } from '@domain/entities/loan-transaction-detail.entity';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
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
  let loanTransactionDetailSaveManySpy: jest.SpyInstance;
  let recordOperationExecuteSpy: jest.SpyInstance;

  const mockMeetingId = 'meeting-id-1';
  const mockMemberId = 'member-id-1';

  const createMockLoan = (
    options: {
      outstandingBalance?: number;
      interestRate?: number;
      status?: LoanStatus;
      approvedAmount?: number;
    } = {},
  ): Loan => {
    const amount =
      options.approvedAmount ??
      Math.max(10000, options.outstandingBalance ?? 10000);
    const loan = Loan.create({
      memberId: mockMemberId,
      loanType: 'corriente',
      approvedAmount: amount,
      monthlyPaymentAmount: 500,
      interestRate: options.interestRate ?? 0.02,
      term: 24,
    });
    loan.update({
      disbursedAmount: amount,
      outstandingBalance: options.outstandingBalance ?? amount,
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
      execute: jest.fn((operation: () => Promise<unknown>) => operation()),
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
    loanTransactionDetailSaveManySpy = jest
      .spyOn(loanTransactionDetailRepository, 'saveMany')
      .mockImplementation((details) => Promise.resolve(details));
  });

  describe('Successful payment recording', () => {
    it('should record a payment with automatic interest/principal calculation', async () => {
      const mockLoan = createMockLoan({
        outstandingBalance: 10000,
        interestRate: 0.02,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

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

      // Should save transaction details in a single batch call (interest + principal)
      expect(loanTransactionDetailSaveManySpy).toHaveBeenCalledTimes(1);
      expect(loanTransactionDetailSaveManySpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            amount: expectedInterest,
            transactionType: LoanTransactionType.INTEREST_PAYMENT,
          }),
          expect.objectContaining({
            amount: expectedPrincipal,
            transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
          }),
        ]),
      );
    });

    it('should record a payment with forced principal amount (no interest)', async () => {
      const mockLoan = createMockLoan({ outstandingBalance: 5000 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

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

      // Should save 1 transaction detail in batch (principal only)
      expect(loanTransactionDetailSaveManySpy).toHaveBeenCalledTimes(1);
      expect(loanTransactionDetailSaveManySpy).toHaveBeenCalledWith([
        expect.objectContaining({
          amount: 1000,
          transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        }),
      ]);
    });

    it('should record a payment with stock payment method (debit STOCK_CAPITAL_ACCOUNT, no CASH entry)', async () => {
      const mockLoan = createMockLoan({ outstandingBalance: 5000 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

      const paymentDate = new Date('2024-08-01');
      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 1000,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: 1000,
        paymentMethod: 'stock',
        sourceAccount: STOCK_CAPITAL_ACCOUNT,
        stockId: 'stock-123',
        stockSubscriptionId: 'sub-456',
        date: paymentDate,
        notes: 'Pago de crédito con 2 acciones',
      };

      const result = await useCase.execute(dto);

      expect(result.interestPaid).toBe(0);
      expect(result.principalPaid).toBe(1000);
      expect(result.newOutstandingBalance).toBe(4000);

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: OperationType.STOCK_LOAN_PAYMENT,
          date: paymentDate,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: STOCK_CAPITAL_ACCOUNT,
              amount: 1000,
              stockId: 'stock-123',
              stockSubscriptionId: 'sub-456',
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: -1000,
            }),
          ]),
        }),
      );

      // Verify CASH is NEVER used in entries
      expect(recordOperationExecuteSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
            }),
          ]),
        }),
      );
    });

    it('should record a payment with equity payment method (debit MEMBER_EQUITY_ACCOUNT, no CASH entry)', async () => {
      const mockLoan = createMockLoan({ outstandingBalance: 5000 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: 500,
        paymentMethod: 'equity',
      };

      const result = await useCase.execute(dto);

      expect(result.principalPaid).toBe(500);

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OperationType.LOAN_PAYMENT,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: MEMBER_EQUITY_ACCOUNT,
              amount: 500,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: -500,
            }),
          ]),
        }),
      );

      // Verify CASH is NEVER used in entries
      expect(recordOperationExecuteSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
            }),
          ]),
        }),
      );
    });

    it('should record a payment with forced amounts', async () => {
      const mockLoan = createMockLoan({ outstandingBalance: 10000 });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

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

      // Should save 1 transaction detail in batch (interest only)
      expect(loanTransactionDetailSaveManySpy).toHaveBeenCalledTimes(1);
      expect(loanTransactionDetailSaveManySpy).toHaveBeenCalledWith([
        expect.objectContaining({
          amount: 100,
          transactionType: LoanTransactionType.INTEREST_PAYMENT,
        }),
      ]);
    });

    it('should handle fractional interest-only payment with 3+ decimal places without precision errors', async () => {
      // $45,698,609.00 * 0.015 = $685,479.135
      const mockLoan = createMockLoan({
        outstandingBalance: 45698609,
        interestRate: 0.015,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

      // Payment with 3 decimal places matching unrounded calculated interest
      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 685479.135,
      };

      const result = await useCase.execute(dto);

      expect(result.interestPaid).toBe(685479.14);
      expect(result.principalPaid).toBe(0);
      expect(result.newOutstandingBalance).toBe(45698609);

      // Cash entry should be normalized to 685479.14
      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: 685479.14,
            }),
            expect.objectContaining({
              accountType: INTEREST_INCOME_ACCOUNT,
              amount: -685479.14,
            }),
          ]),
        }),
      );
    });

    it('should handle interest-only payment when paid amount is slightly less due to rounding down', async () => {
      // When user/client pays 685,479.13 (rounded down from 685,479.135)
      const mockLoan = createMockLoan({
        outstandingBalance: 45698609,
        interestRate: 0.015,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 685479.13,
      };

      const result = await useCase.execute(dto);

      expect(result.interestPaid).toBe(685479.13);
      expect(result.principalPaid).toBe(0);
      expect(result.newOutstandingBalance).toBe(45698609);
    });

    it('should automatically complete payoff and mark loan as paid when residual balance is within tolerance (<= 1.00 COP)', async () => {
      // Real case scenario: Loan with balance 6,307,142.11 and payment of 6,307,141.47 (leaving 0.64 COP)
      const mockLoan = createMockLoan({
        outstandingBalance: 6307142.11,
        approvedAmount: 6307142.11,
        interestRate: 0,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      jest
        .spyOn(stockSubscriptionRepository, 'findByFinancingLoan')
        .mockResolvedValue([]);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 6307141.47,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: 6307141.47,
      };

      const result = await useCase.execute(dto);

      // Value completed before operation: principal covered is full 6307142.11
      expect(result.principalPaid).toBe(6307142.11);
      expect(result.newOutstandingBalance).toBe(0);
      expect(result.loanStatus).toBe(LoanStatus.PAID);

      // Ledger entries must balance to zero with no extra adjustment entries
      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: 6307142.11,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: -6307142.11,
            }),
          ],
        }),
      );
    });

    it('should fully liquidate loan when isFullPayoff is true', async () => {
      const mockLoan = createMockLoan({
        outstandingBalance: 5000000,
        approvedAmount: 5000000,
        interestRate: 0.015,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);
      jest
        .spyOn(stockSubscriptionRepository, 'findByFinancingLoan')
        .mockResolvedValue([]);

      // interest = 5000000 * 0.015 = 75000
      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 0,
        isFullPayoff: true,
      };

      const result = await useCase.execute(dto);

      expect(result.principalPaid).toBe(5000000);
      expect(result.interestPaid).toBe(75000);
      expect(result.newOutstandingBalance).toBe(0);
      expect(result.loanStatus).toBe(LoanStatus.PAID);

      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: 5075000,
            }),
            expect.objectContaining({
              accountType: INTEREST_INCOME_ACCOUNT,
              amount: -75000,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: -5000000,
            }),
          ],
        }),
      );
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

    it('should not record accounting operation if loan domain validation fails', async () => {
      const mockLoan = createMockLoan({
        status: LoanStatus.DEFAULTED,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);

      const dto: RecordLoanPaymentDto = {
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Can only record payments for active or pending loans',
      );

      // Verify accounting operation was never executed or persisted
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
      expect(loanSaveSpy).not.toHaveBeenCalled();
    });
  });

  describe('Description building', () => {
    it('should use custom notes when provided', async () => {
      const mockLoan = createMockLoan();
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

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

    it('should handle only forcedPrincipalAmount andonly forcedInterestAmount, plus default descriptions for stock/equity/interest-only/principal-only', async () => {
      // 1. Only forcedPrincipalAmount
      const loan1 = createMockLoan({ outstandingBalance: 5000 });
      loanFindByIdSpy.mockResolvedValueOnce(loan1);
      loanSaveSpy.mockResolvedValueOnce(loan1);

      const res1 = await useCase.execute({
        loanId: loan1.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 1000,
        forcedPrincipalAmount: 800,
      });
      expect(res1.principalPaid).toBe(800);
      expect(res1.interestPaid).toBe(200);

      // 2. Only forcedInterestAmount
      const loan2 = createMockLoan({ outstandingBalance: 5000 });
      loanFindByIdSpy.mockResolvedValueOnce(loan2);
      loanSaveSpy.mockResolvedValueOnce(loan2);

      const res2 = await useCase.execute({
        loanId: loan2.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 1000,
        forcedInterestAmount: 250,
      });
      expect(res2.interestPaid).toBe(250);
      expect(res2.principalPaid).toBe(750);

      // 3. Stock payment without custom notes and without sourceAccount
      const loan3 = createMockLoan({ outstandingBalance: 5000 });
      loanFindByIdSpy.mockResolvedValueOnce(loan3);
      loanSaveSpy.mockResolvedValueOnce(loan3);

      await useCase.execute({
        loanId: loan3.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: 500,
        paymentMethod: 'stock',
      });
      expect(recordOperationExecuteSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          description: 'Pago de crédito con acciones: 500.00',
        }),
      );

      // 4. Cash principal-only without notes
      const loan4 = createMockLoan({
        outstandingBalance: 5000,
        interestRate: 0,
      });
      loanFindByIdSpy.mockResolvedValueOnce(loan4);
      loanSaveSpy.mockResolvedValueOnce(loan4);

      await useCase.execute({
        loanId: loan4.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 500,
      });
      expect(recordOperationExecuteSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          description: 'Pago de capital de préstamo: 500.00',
        }),
      );

      // 5. Full payoff with forcedInterestAmount
      const loan5 = createMockLoan({ outstandingBalance: 2000 });
      loanFindByIdSpy.mockResolvedValueOnce(loan5);
      loanSaveSpy.mockResolvedValueOnce(loan5);

      const res5 = await useCase.execute({
        loanId: loan5.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 0,
        isFullPayoff: true,
        forcedInterestAmount: 50,
      });
      expect(res5.principalPaid).toBe(2000);
      expect(res5.interestPaid).toBe(50);
    });

    it('should release and consolidate financed stock subscriptions when loan is fully paid', async () => {
      const { StockSubscription } = await import(
        '@domain/entities/stock-subscription.entity'
      );
      const mockLoan = createMockLoan({
        outstandingBalance: 1000,
        interestRate: 0,
      });
      loanFindByIdSpy.mockResolvedValue(mockLoan);
      loanSaveSpy.mockResolvedValue(mockLoan);

      const financedSub1 = StockSubscription.create({
        memberId: mockMemberId,
        stockId: 'stock-1',
        quantity: 2,
        financingLoanId: mockLoan.id,
      });
      const financedSub2 = StockSubscription.create({
        memberId: mockMemberId,
        stockId: 'stock-2',
        quantity: 3,
        financingLoanId: mockLoan.id,
      });
      const existingFreeSub1 = StockSubscription.create({
        memberId: mockMemberId,
        stockId: 'stock-1',
        quantity: 5,
      });

      stockSubscriptionRepository.findFreeOfFinancing = jest
        .fn()
        .mockResolvedValue([existingFreeSub1]);
      jest
        .spyOn(stockSubscriptionRepository, 'findByFinancingLoan')
        .mockResolvedValue([financedSub1, financedSub2]);
      const saveManySubsSpy = jest
        .spyOn(stockSubscriptionRepository, 'saveMany')
        .mockResolvedValue([]);

      await useCase.execute({
        loanId: mockLoan.id,
        meetingId: mockMeetingId,
        totalPaymentAmount: 1000,
        isFullPayoff: true,
      });

      expect(saveManySubsSpy).toHaveBeenCalledTimes(1);
      expect(existingFreeSub1.quantity).toBe(7); // 5 + 2 consolidated
      expect(financedSub1.isActive()).toBe(false);
      expect(financedSub2.financingLoanId).toBeNull();
    });
  });
});
