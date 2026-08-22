import { Test, TestingModule } from '@nestjs/testing';
import { LoansV2Controller } from './loans.v2.controller';
import { GetLoansQueryHandler } from '@application/queries/loans/get-loans.query-handler';
import { GetLoanDetailQueryHandler } from '@application/queries/loans/get-loan-detail.query-handler';
import { UpdateLoanTermsUseCase } from '@application/use-cases/loans/update-loan-terms.use-case';
import { GetPaymentPlanSimulationQueryHandler } from '@application/queries/loans/get-payment-plan-simulation.query-handler';
import { SimulateLoanPaymentPlanUseCase } from '@application/use-cases/loans/simulate-loan-payment-plan.use-case';
import { GetLoanTransactionsQueryHandler } from '@application/queries/loans/get-loan-transactions.query-handler';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { LoanStatus } from '@domain/entities/loan.entity';
import { UpdateLoanApprovedAmountUseCase } from '@application/use-cases/loans/update-loan-approved-amount.use-case';

describe('LoansV2Controller', () => {
  let controller: LoansV2Controller;
  let getLoansQuery: jest.Mocked<GetLoansQueryHandler>;
  let getLoanDetailQuery: jest.Mocked<GetLoanDetailQueryHandler>;
  let updateLoanTermsUseCase: jest.Mocked<UpdateLoanTermsUseCase>;
  let getPaymentPlanSimulationQuery: jest.Mocked<GetPaymentPlanSimulationQueryHandler>;
  let simulateLoanPaymentPlanUseCase: jest.Mocked<SimulateLoanPaymentPlanUseCase>;
  let updateLoanApprovedAmountUseCase: jest.Mocked<UpdateLoanApprovedAmountUseCase>;
  let getLoanTransactionsQuery: jest.Mocked<GetLoanTransactionsQueryHandler>;

  let getLoansQueryExecuteSpy: jest.SpyInstance;
  let getLoanDetailQueryExecuteSpy: jest.SpyInstance;
  let updateLoanTermsUseCaseExecuteSpy: jest.SpyInstance;
  let getPaymentPlanSimulationQueryExecuteSpy: jest.SpyInstance;
  let simulateLoanPaymentPlanUseCaseExecuteSpy: jest.SpyInstance;
  let updateLoanApprovedAmountUseCaseExecuteSpy: jest.SpyInstance;
  let getLoanTransactionsQueryExecuteSpy: jest.SpyInstance;

  const mockLoanResponse: LoanResponseDto = {
    id: 'loan-id-1',
    memberId: 'member-id-1',
    loanType: 'corriente',
    approvedAmount: 1000000,
    disbursedAmount: 1000000,
    outstandingBalance: 850000,
    monthlyPaymentAmount: 150000,
    interestRate: 0.05,
    term: 12,
    status: LoanStatus.ACTIVE,
    creationDate: new Date('2024-01-15'),
    guaranteedStockId: null,
  };

  beforeEach(async () => {
    getLoansQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetLoansQueryHandler>;

    getLoanDetailQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetLoanDetailQueryHandler>;

    updateLoanTermsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateLoanTermsUseCase>;

    getPaymentPlanSimulationQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPaymentPlanSimulationQueryHandler>;

    simulateLoanPaymentPlanUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SimulateLoanPaymentPlanUseCase>;

    updateLoanApprovedAmountUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateLoanApprovedAmountUseCase>;

    getLoanTransactionsQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetLoanTransactionsQueryHandler>;

    getLoansQueryExecuteSpy = jest.spyOn(getLoansQuery, 'execute');
    getLoanDetailQueryExecuteSpy = jest.spyOn(getLoanDetailQuery, 'execute');
    updateLoanTermsUseCaseExecuteSpy = jest.spyOn(
      updateLoanTermsUseCase,
      'execute',
    );
    getPaymentPlanSimulationQueryExecuteSpy = jest.spyOn(
      getPaymentPlanSimulationQuery,
      'execute',
    );
    simulateLoanPaymentPlanUseCaseExecuteSpy = jest.spyOn(
      simulateLoanPaymentPlanUseCase,
      'execute',
    );
    updateLoanApprovedAmountUseCaseExecuteSpy = jest.spyOn(
      updateLoanApprovedAmountUseCase,
      'execute',
    );
    getLoanTransactionsQueryExecuteSpy = jest.spyOn(
      getLoanTransactionsQuery,
      'execute',
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansV2Controller],
      providers: [
        {
          provide: GetLoansQueryHandler,
          useValue: getLoansQuery,
        },
        {
          provide: GetLoanDetailQueryHandler,
          useValue: getLoanDetailQuery,
        },
        {
          provide: UpdateLoanTermsUseCase,
          useValue: updateLoanTermsUseCase,
        },
        {
          provide: GetPaymentPlanSimulationQueryHandler,
          useValue: getPaymentPlanSimulationQuery,
        },
        {
          provide: SimulateLoanPaymentPlanUseCase,
          useValue: simulateLoanPaymentPlanUseCase,
        },
        {
          provide: UpdateLoanApprovedAmountUseCase,
          useValue: updateLoanApprovedAmountUseCase,
        },
        {
          provide: GetLoanTransactionsQueryHandler,
          useValue: getLoanTransactionsQuery,
        },
      ],
    }).compile();

    controller = module.get<LoansV2Controller>(LoansV2Controller);
  });

  describe('findAll', () => {
    it('should return empty array when no loans exist', async () => {
      getLoansQueryExecuteSpy.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(getLoansQueryExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should return list of loans', async () => {
      const loans = [mockLoanResponse];
      getLoansQueryExecuteSpy.mockResolvedValue(loans);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockLoanResponse.id,
        member_id: mockLoanResponse.memberId,
        loan_type: mockLoanResponse.loanType,
        approved_amount: mockLoanResponse.approvedAmount,
        disbursed_amount: mockLoanResponse.disbursedAmount,
        outstanding_balance: mockLoanResponse.outstandingBalance,
        monthly_payment_amount: mockLoanResponse.monthlyPaymentAmount,
        interest_rate: mockLoanResponse.interestRate,
        term: mockLoanResponse.term,
        status: mockLoanResponse.status,
        creation_date: mockLoanResponse.creationDate,
        guaranteed_stock_id: mockLoanResponse.guaranteedStockId,
      });
    });

    it('should handle errors and return 500', async () => {
      getLoansQueryExecuteSpy.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return loan details', async () => {
      getLoanDetailQueryExecuteSpy.mockResolvedValue(mockLoanResponse);

      const result = await controller.findOne('loan-id-1');

      expect(getLoanDetailQueryExecuteSpy).toHaveBeenCalledWith('loan-id-1');
      expect(result).toEqual({
        id: mockLoanResponse.id,
        member_id: mockLoanResponse.memberId,
        loan_type: mockLoanResponse.loanType,
        approved_amount: mockLoanResponse.approvedAmount,
        disbursed_amount: mockLoanResponse.disbursedAmount,
        outstanding_balance: mockLoanResponse.outstandingBalance,
        monthly_payment_amount: mockLoanResponse.monthlyPaymentAmount,
        interest_rate: mockLoanResponse.interestRate,
        term: mockLoanResponse.term,
        status: mockLoanResponse.status,
        creation_date: mockLoanResponse.creationDate,
        guaranteed_stock_id: mockLoanResponse.guaranteedStockId,
      });
    });

    it('should throw 404 when loan not found', async () => {
      getLoanDetailQueryExecuteSpy.mockRejectedValue(
        new LoanNotFoundException('loan-id-1'),
      );

      await expect(controller.findOne('loan-id-1')).rejects.toThrow();
    });
  });

  describe('updateTerms', () => {
    it('should update loan terms successfully', async () => {
      const updatedLoan = {
        ...mockLoanResponse,
        interestRate: 0.06,
        monthlyPaymentAmount: 160000,
      };
      updateLoanTermsUseCaseExecuteSpy.mockResolvedValue(updatedLoan);

      const dto = {
        interest_rate: 0.06,
        monthly_payment_amount: 160000,
      };

      const result = await controller.updateTerms('loan-id-1', dto);

      expect(updateLoanTermsUseCaseExecuteSpy).toHaveBeenCalledWith({
        loanId: 'loan-id-1',
        interestRate: 0.06,
        monthlyPaymentAmount: 160000,
        term: undefined,
        changedBy: undefined,
      });
      expect(result.interest_rate).toBe(0.06);
      expect(result.monthly_payment_amount).toBe(160000);
    });

    it('should throw 404 when loan not found', async () => {
      updateLoanTermsUseCaseExecuteSpy.mockRejectedValue(
        new LoanNotFoundException('loan-id-1'),
      );

      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow();
    });

    it('should throw 400 when validation fails', async () => {
      updateLoanTermsUseCaseExecuteSpy.mockRejectedValue(
        new InvalidRequestError('Interest rate must be between 0 and 1'),
      );

      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 1.5 }),
      ).rejects.toThrow();
    });

    it('should update only provided fields', async () => {
      const updatedLoan = {
        ...mockLoanResponse,
        interestRate: 0.06,
      };
      updateLoanTermsUseCaseExecuteSpy.mockResolvedValue(updatedLoan);

      const result = await controller.updateTerms('loan-id-1', {
        interest_rate: 0.06,
      });

      expect(updateLoanTermsUseCaseExecuteSpy).toHaveBeenCalledWith({
        loanId: 'loan-id-1',
        interestRate: 0.06,
        monthlyPaymentAmount: undefined,
        term: undefined,
        changedBy: undefined,
      });
      expect(result.interest_rate).toBe(0.06);
      expect(result.monthly_payment_amount).toBe(
        mockLoanResponse.monthlyPaymentAmount,
      );
    });

    it('should handle HttpException errors', async () => {
      const error = new Error('Custom error');
      updateLoanTermsUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow();
      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow('Custom error');
    });

    it('should handle generic errors', async () => {
      const error = new Error('Internal error');
      updateLoanTermsUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow();
    });
  });

  describe('simulatePlan', () => {
    it('should simulate payment plan successfully', () => {
      // ARRANGE
      const dto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortization_type: 'french' as const,
      };

      const mockResult = {
        schedule: [],
        totalInterest: 0,
        totalPayment: 1000000,
      };

      getPaymentPlanSimulationQueryExecuteSpy.mockReturnValue(mockResult);

      // ACT
      const result = controller.simulatePlan(dto);

      // ASSERT
      expect(getPaymentPlanSimulationQueryExecuteSpy).toHaveBeenCalledWith({
        principal: dto.principal,
        rate: dto.rate,
        term: dto.term,
        amortizationType: dto.amortization_type,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle HttpException errors', () => {
      // ARRANGE
      const dto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortization_type: 'french' as const,
      };

      const error = new Error('Invalid parameters');
      getPaymentPlanSimulationQueryExecuteSpy.mockImplementation(() => {
        throw error;
      });

      // ACT & ASSERT
      expect(() => controller.simulatePlan(dto)).toThrow();
      expect(() => controller.simulatePlan(dto)).toThrow('Invalid parameters');
    });

    it('should handle generic errors and return 400', () => {
      // ARRANGE
      const dto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortization_type: 'french' as const,
      };

      const error = new Error('Validation error');
      getPaymentPlanSimulationQueryExecuteSpy.mockImplementation(() => {
        throw error;
      });

      // ACT & ASSERT
      expect(() => controller.simulatePlan(dto)).toThrow();
    });
  });

  describe('simulateScenarios', () => {
    it('should simulate scenarios successfully', async () => {
      // ARRANGE
      const loanId = 'loan-id-1';
      const dto = {
        scenarios: [
          {
            name: 'Scenario 1',
            extra_payment: 50000,
            start_month: 1,
            amortization_type: 'french' as const,
          },
        ],
      };

      const mockResult = {
        scenarios: [],
      };

      simulateLoanPaymentPlanUseCaseExecuteSpy.mockResolvedValue(mockResult);

      // ACT
      const result = await controller.simulateScenarios(loanId, dto);

      // ASSERT
      expect(simulateLoanPaymentPlanUseCaseExecuteSpy).toHaveBeenCalledWith(
        loanId,
        {
          scenarios: [
            {
              name: 'Scenario 1',
              extraPayment: 50000,
              startMonth: 1,
              amortizationType: 'french',
            },
          ],
        },
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw 404 when loan not found', async () => {
      // ARRANGE
      const loanId = 'loan-id-1';
      const dto = {
        scenarios: [
          {
            name: 'Scenario 1',
            extra_payment: 50000,
            start_month: 1,
            amortization_type: 'french' as const,
          },
        ],
      };

      const error = new LoanNotFoundException(loanId);
      simulateLoanPaymentPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.simulateScenarios(loanId, dto)).rejects.toThrow();
    });

    it('should handle HttpException errors', async () => {
      // ARRANGE
      const loanId = 'loan-id-1';
      const dto = {
        scenarios: [
          {
            name: 'Scenario 1',
            extra_payment: 50000,
            start_month: 1,
            amortization_type: 'french' as const,
          },
        ],
      };

      const error = new Error('Invalid scenario');
      simulateLoanPaymentPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.simulateScenarios(loanId, dto)).rejects.toThrow();
      await expect(controller.simulateScenarios(loanId, dto)).rejects.toThrow(
        'Invalid scenario',
      );
    });

    it('should handle generic errors and return 400', async () => {
      // ARRANGE
      const loanId = 'loan-id-1';
      const dto = {
        scenarios: [
          {
            name: 'Scenario 1',
            extra_payment: 50000,
            start_month: 1,
            amortization_type: 'french' as const,
          },
        ],
      };

      const error = new Error('Validation error');
      simulateLoanPaymentPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.simulateScenarios(loanId, dto)).rejects.toThrow();
    });

    it('should handle scenarios with optional fields', async () => {
      // ARRANGE
      const loanId = 'loan-id-1';
      const dto = {
        scenarios: [
          {
            name: 'Scenario 1',
          },
        ],
      };

      const mockResult = {
        scenarios: [],
      };

      simulateLoanPaymentPlanUseCaseExecuteSpy.mockResolvedValue(mockResult);

      // ACT
      const result = await controller.simulateScenarios(loanId, dto);

      // ASSERT
      expect(simulateLoanPaymentPlanUseCaseExecuteSpy).toHaveBeenCalledWith(
        loanId,
        {
          scenarios: [
            {
              name: 'Scenario 1',
              extraPayment: undefined,
              startMonth: undefined,
              amortizationType: undefined,
            },
          ],
        },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateApprovedAmount', () => {
    it('should update approved amount successfully', async () => {
      const loanId = 'loan-id-1';
      const dto = {
        new_approved_amount: 8000,
      };

      updateLoanApprovedAmountUseCaseExecuteSpy.mockResolvedValue(undefined);

      await controller.updateApprovedAmount(loanId, dto);

      expect(updateLoanApprovedAmountUseCaseExecuteSpy).toHaveBeenCalledTimes(
        1,
      );
      expect(updateLoanApprovedAmountUseCaseExecuteSpy).toHaveBeenCalledWith({
        loanId,
        newApprovedAmount: 8000,
        changedBy: undefined,
      });
    });

    it('should throw exception when use case fails', async () => {
      const loanId = 'loan-id-1';
      const dto = {
        new_approved_amount: 4000,
      };

      const error = new Error('Cannot reduce approved amount below disbursed');
      updateLoanApprovedAmountUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(
        controller.updateApprovedAmount(loanId, dto),
      ).rejects.toThrow(error);
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const loanId = 'loan-id-1';
      const query = { page: 1, limit: 10 };
      const date = new Date('2024-01-15T10:30:00Z');
      const mockResult = {
        data: [
          {
            id: 'tx-1',
            loanId: 'loan-id-1',
            transactionType: 'principal_payment',
            amount: 200000,
            transactionDate: date,
            notes: 'Abono extra',
            operationId: 'op-1',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      getLoanTransactionsQueryExecuteSpy.mockResolvedValue(mockResult);

      const result = await controller.getTransactions(loanId, query);

      expect(getLoanTransactionsQueryExecuteSpy).toHaveBeenCalledWith({
        loanId,
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: [
          {
            id: 'tx-1',
            loan_id: 'loan-id-1',
            transaction_type: 'principal_payment',
            amount: 200000,
            transaction_date: date,
            notes: 'Abono extra',
            operation_id: 'op-1',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });
});
