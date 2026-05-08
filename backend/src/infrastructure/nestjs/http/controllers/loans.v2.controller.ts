import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MemberRole } from '@domain/enums/member-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { GetLoansQueryHandler } from '@application/queries/loans/get-loans.query-handler';
import { GetLoanDetailQueryHandler } from '@application/queries/loans/get-loan-detail.query-handler';
import { UpdateLoanTermsUseCase } from '@application/use-cases/loans/update-loan-terms.use-case';
import { GetPaymentPlanSimulationQueryHandler } from '@application/queries/loans/get-payment-plan-simulation.query-handler';
import { SimulateLoanPaymentPlanUseCase } from '@application/use-cases/loans/simulate-loan-payment-plan.use-case';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';
import { PaymentPlanRequestDto } from '@application/dto/loans/payment-plan-request.dto';
import { SimulateLoanScenariosRequestDto } from '@application/dto/loans/simulate-loan-scenarios-request.dto';
import { LoanResponseHttpDto } from '../dto/loan-response-http.dto';
import { UpdateLoanTermsHttpDto } from '../dto/update-loan-terms-http.dto';
import { PaymentPlanRequestHttpDto } from '../dto/payment-plan-request-http.dto';
import { SimulateLoanScenariosRequestHttpDto } from '../dto/simulate-loan-scenarios-request-http.dto';
import { UpdateLoanTermsDto } from '@application/dto/loans/update-loan-terms.dto';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

@ApiTags('Loans V2')
@Controller('v2/loans')
export class LoansV2Controller {
  constructor(
    private readonly getLoansQuery: GetLoansQueryHandler,
    private readonly getLoanDetailQuery: GetLoanDetailQueryHandler,
    private readonly updateLoanTermsUseCase: UpdateLoanTermsUseCase,
    private readonly getPaymentPlanSimulationQuery: GetPaymentPlanSimulationQueryHandler,
    private readonly simulateLoanPaymentPlanUseCase: SimulateLoanPaymentPlanUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all loans',
    description: 'Returns a list of all loans in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of loans retrieved successfully',
    type: [LoanResponseHttpDto],
  })
  async findAll(): Promise<LoanResponseHttpDto[]> {
    try {
      const loans = await this.getLoansQuery.execute();
      return loans.map((loan) => this.mapLoanToHttp(loan));
    } catch (error: unknown) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get loan details by ID',
    description: 'Returns detailed information about a specific loan',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan details retrieved successfully',
    type: LoanResponseHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Loan not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanResponseHttpDto> {
    try {
      const loan = await this.getLoanDetailQuery.execute(id);
      return this.mapLoanToHttp(loan);
    } catch (error: unknown) {
      if (error instanceof LoanNotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Patch(':id/terms')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Update loan terms (Administrative)',
    description:
      'Allows administrators to update loan terms (interest rate, monthly payment, term). This operation is audited.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: UpdateLoanTermsHttpDto,
    description: 'Loan terms to update (all fields optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan terms updated successfully',
    type: LoanResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data (e.g., invalid interest rate)',
  })
  @ApiNotFoundResponse({
    description: 'Loan not found',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateTerms(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanTermsHttpDto,
  ): Promise<LoanResponseHttpDto> {
    try {
      const updateDto: UpdateLoanTermsDto = {
        loanId: id,
        interestRate: dto.interest_rate,
        monthlyPaymentAmount: dto.monthly_payment_amount,
        term: dto.term,
        // TODO: Extract user ID from request context when authentication is implemented
        changedBy: undefined,
      };
      const result = await this.updateLoanTermsUseCase.execute(updateDto);
      return this.mapLoanToHttp(result);
    } catch (error: unknown) {
      if (error instanceof LoanNotFoundException) {
        throw error;
      }
      if (error instanceof InvalidRequestError) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  @Post('simulate-plan')
  @ApiOperation({
    summary: 'Simulate payment plan',
    description:
      'Calculates amortization schedule for generic loan parameters (French or German amortization)',
  })
  @ApiBody({
    type: PaymentPlanRequestHttpDto,
    description: 'Loan parameters for simulation',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment plan calculated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  simulatePlan(@Body() dto: PaymentPlanRequestHttpDto) {
    try {
      const request: PaymentPlanRequestDto = {
        principal: dto.principal,
        rate: dto.rate,
        term: dto.term,
        amortizationType: dto.amortization_type,
      };
      return this.getPaymentPlanSimulationQuery.execute(request);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/simulate-scenarios')
  @ApiOperation({
    summary: 'Simulate payment scenarios for existing loan',
    description:
      'Compares different payment scenarios (with extra payments) for an existing loan',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: SimulateLoanScenariosRequestHttpDto,
    description: 'Scenarios to simulate',
  })
  @ApiResponse({
    status: 200,
    description: 'Scenarios calculated successfully',
  })
  @ApiNotFoundResponse({
    description: 'Loan not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async simulateScenarios(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SimulateLoanScenariosRequestHttpDto,
  ) {
    try {
      const request: SimulateLoanScenariosRequestDto = {
        scenarios: dto.scenarios.map((s) => ({
          name: s.name,
          extraPayment: s.extra_payment,
          startMonth: s.start_month,
          amortizationType: s.amortization_type,
        })),
      };
      return await this.simulateLoanPaymentPlanUseCase.execute(id, request);
    } catch (error: unknown) {
      if (error instanceof LoanNotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private mapLoanToHttp(loan: LoanResponseDto): LoanResponseHttpDto {
    return {
      id: loan.id,
      member_id: loan.memberId,
      loan_type: loan.loanType,
      approved_amount: loan.approvedAmount,
      disbursed_amount: loan.disbursedAmount,
      outstanding_balance: loan.outstandingBalance,
      monthly_payment_amount: loan.monthlyPaymentAmount,
      interest_rate: loan.interestRate,
      term: loan.term,
      status: loan.status,
      creation_date: loan.creationDate,
      guaranteed_stock_id: loan.guaranteedStockId,
    };
  }
}
