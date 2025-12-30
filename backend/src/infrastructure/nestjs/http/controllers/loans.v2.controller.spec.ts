import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LoansV2Controller } from './loans.v2.controller';
import { GetLoansQueryHandler } from '@application/queries/loans/get-loans.query-handler';
import { GetLoanDetailQueryHandler } from '@application/queries/loans/get-loan-detail.query-handler';
import { GetMemberLoansQueryHandler } from '@application/queries/loans/get-member-loans.query-handler';
import { UpdateLoanTermsUseCase } from '@application/use-cases/loans/update-loan-terms.use-case';
import { GetPaymentPlanSimulationQueryHandler } from '@application/queries/loans/get-payment-plan-simulation.query-handler';
import { SimulateLoanPaymentPlanUseCase } from '@application/use-cases/loans/simulate-loan-payment-plan.use-case';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { LoanStatus } from '@domain/entities/loan.entity';

describe('LoansV2Controller', () => {
  let controller: LoansV2Controller;
  let getLoansQuery: jest.Mocked<GetLoansQueryHandler>;
  let getLoanDetailQuery: jest.Mocked<GetLoanDetailQueryHandler>;
  let getMemberLoansQuery: jest.Mocked<GetMemberLoansQueryHandler>;
  let updateLoanTermsUseCase: jest.Mocked<UpdateLoanTermsUseCase>;
  let getPaymentPlanSimulationQuery: jest.Mocked<GetPaymentPlanSimulationQueryHandler>;
  let simulateLoanPaymentPlanUseCase: jest.Mocked<SimulateLoanPaymentPlanUseCase>;

  let getLoansQueryExecuteSpy: jest.SpyInstance;
  let getLoanDetailQueryExecuteSpy: jest.SpyInstance;
  let getMemberLoansQueryExecuteSpy: jest.SpyInstance;
  let updateLoanTermsUseCaseExecuteSpy: jest.SpyInstance;
  let getPaymentPlanSimulationQueryExecuteSpy: jest.SpyInstance;
  let simulateLoanPaymentPlanUseCaseExecuteSpy: jest.SpyInstance;

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

    getMemberLoansQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetMemberLoansQueryHandler>;

    updateLoanTermsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateLoanTermsUseCase>;

    getPaymentPlanSimulationQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPaymentPlanSimulationQueryHandler>;

    simulateLoanPaymentPlanUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SimulateLoanPaymentPlanUseCase>;

    getLoansQueryExecuteSpy = jest.spyOn(getLoansQuery, 'execute');
    getLoanDetailQueryExecuteSpy = jest.spyOn(getLoanDetailQuery, 'execute');
    getMemberLoansQueryExecuteSpy = jest.spyOn(getMemberLoansQuery, 'execute');
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
          provide: GetMemberLoansQueryHandler,
          useValue: getMemberLoansQuery,
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

      await expect(controller.findAll()).rejects.toThrow(HttpException);
      await expect(controller.findAll()).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
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

      await expect(controller.findOne('loan-id-1')).rejects.toThrow(
        HttpException,
      );
      await expect(controller.findOne('loan-id-1')).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
        }),
      );
    });
  });

  describe('findByMember', () => {
    it('should return empty array when member has no loans', async () => {
      getMemberLoansQueryExecuteSpy.mockResolvedValue([]);

      const result = await controller.findByMember('member-id-1');

      expect(getMemberLoansQueryExecuteSpy).toHaveBeenCalledWith('member-id-1');
      expect(result).toEqual([]);
    });

    it('should return loans for a member', async () => {
      const loans = [mockLoanResponse];
      getMemberLoansQueryExecuteSpy.mockResolvedValue(loans);

      const result = await controller.findByMember('member-id-1');

      expect(result).toHaveLength(1);
      expect(result[0].member_id).toBe('member-id-1');
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
      ).rejects.toThrow(HttpException);
      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
        }),
      );
    });

    it('should throw 400 when validation fails', async () => {
      updateLoanTermsUseCaseExecuteSpy.mockRejectedValue(
        new InvalidRequestError('Interest rate must be between 0 and 1'),
      );

      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 1.5 }),
      ).rejects.toThrow(HttpException);
      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 1.5 }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }),
      );
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
      const error = new HttpException('Custom error', HttpStatus.BAD_REQUEST);
      updateLoanTermsUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow(HttpException);
      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow('Custom error');
    });

    it('should handle generic errors', async () => {
      const error = new Error('Internal error');
      updateLoanTermsUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow(HttpException);
      await expect(
        controller.updateTerms('loan-id-1', { interest_rate: 0.06 }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
    });
  });

  describe('simulatePlan', () => {
    it('should simulate payment plan successfully', () => {
      // ARRANGE
      const dto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortizationType: 'french' as const,
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
        amortizationType: dto.amortizationType,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle HttpException errors', () => {
      // ARRANGE
      const dto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortizationType: 'french' as const,
      };

      const error = new HttpException(
        'Invalid parameters',
        HttpStatus.BAD_REQUEST,
      );
      getPaymentPlanSimulationQueryExecuteSpy.mockImplementation(() => {
        throw error;
      });

      // ACT & ASSERT
      expect(() => controller.simulatePlan(dto)).toThrow(HttpException);
      expect(() => controller.simulatePlan(dto)).toThrow('Invalid parameters');
    });

    it('should handle generic errors and return 400', () => {
      // ARRANGE
      const dto = {
        principal: 1000000,
        rate: 0.01,
        term: 12,
        amortizationType: 'french' as const,
      };

      const error = new Error('Validation error');
      getPaymentPlanSimulationQueryExecuteSpy.mockImplementation(() => {
        throw error;
      });

      // ACT & ASSERT
      expect(() => controller.simulatePlan(dto)).toThrow(HttpException);
      try {
        controller.simulatePlan(dto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        if (e instanceof HttpException) {
          expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        }
      }
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
            extraPayment: 50000,
            startMonth: 1,
            amortizationType: 'french' as const,
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
            extraPayment: 50000,
            startMonth: 1,
            amortizationType: 'french' as const,
          },
        ],
      };

      const error = new LoanNotFoundException(loanId);
      simulateLoanPaymentPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.simulateScenarios(loanId, dto)).rejects.toThrow(
        HttpException,
      );
      try {
        await controller.simulateScenarios(loanId, dto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        if (e instanceof HttpException) {
          expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
        }
      }
    });

    it('should handle HttpException errors', async () => {
      // ARRANGE
      const loanId = 'loan-id-1';
      const dto = {
        scenarios: [
          {
            name: 'Scenario 1',
            extraPayment: 50000,
            startMonth: 1,
            amortizationType: 'french' as const,
          },
        ],
      };

      const error = new HttpException(
        'Invalid scenario',
        HttpStatus.BAD_REQUEST,
      );
      simulateLoanPaymentPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.simulateScenarios(loanId, dto)).rejects.toThrow(
        HttpException,
      );
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
            extraPayment: 50000,
            startMonth: 1,
            amortizationType: 'french' as const,
          },
        ],
      };

      const error = new Error('Validation error');
      simulateLoanPaymentPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.simulateScenarios(loanId, dto)).rejects.toThrow(
        HttpException,
      );
      try {
        await controller.simulateScenarios(loanId, dto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        if (e instanceof HttpException) {
          expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        }
      }
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
});
