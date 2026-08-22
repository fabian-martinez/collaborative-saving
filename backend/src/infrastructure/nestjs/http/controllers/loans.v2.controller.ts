import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
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
import { GetLoanTransactionsQueryHandler } from '@application/queries/loans/get-loan-transactions.query-handler';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';
import { PaymentPlanRequestDto } from '@application/dto/loans/payment-plan-request.dto';
import { SimulateLoanScenariosRequestDto } from '@application/dto/loans/simulate-loan-scenarios-request.dto';
import { LoanResponseHttpDto } from '../dto/loan-response-http.dto';
import { UpdateLoanTermsHttpDto } from '../dto/update-loan-terms-http.dto';
import { PaymentPlanRequestHttpDto } from '../dto/payment-plan-request-http.dto';
import { SimulateLoanScenariosRequestHttpDto } from '../dto/simulate-loan-scenarios-request-http.dto';
import { UpdateLoanTermsDto } from '@application/dto/loans/update-loan-terms.dto';
import { UpdateLoanApprovedAmountUseCase } from '@application/use-cases/loans/update-loan-approved-amount.use-case';
import { UpdateLoanApprovedAmountHttpDto } from '../dto/update-loan-approved-amount-http.dto';
import { UpdateLoanApprovedAmountDto } from '@application/dto/loans/update-loan-approved-amount.dto';
import { GetLoanTransactionsQueryHttpDto } from '../dto/get-loan-transactions-query-http.dto';
import { LoanTransactionResponseHttpDto } from '../dto/loan-transaction-response-http.dto';
import { PaginatedResponseHttpDto } from '../dto/paginated-response-http.dto';

@ApiTags('Loans V2')
@Controller('v2/loans')
export class LoansV2Controller {
  constructor(
    private readonly getLoansQuery: GetLoansQueryHandler,
    private readonly getLoanDetailQuery: GetLoanDetailQueryHandler,
    private readonly updateLoanTermsUseCase: UpdateLoanTermsUseCase,
    private readonly getPaymentPlanSimulationQuery: GetPaymentPlanSimulationQueryHandler,
    private readonly simulateLoanPaymentPlanUseCase: SimulateLoanPaymentPlanUseCase,
    private readonly updateLoanApprovedAmountUseCase: UpdateLoanApprovedAmountUseCase,
    private readonly getLoanTransactionsQuery: GetLoanTransactionsQueryHandler,
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
    const loans = await this.getLoansQuery.execute();
    return loans.map((loan) => this.mapLoanToHttp(loan));
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
    const loan = await this.getLoanDetailQuery.execute(id);
    return this.mapLoanToHttp(loan);
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
    const request: PaymentPlanRequestDto = {
      principal: dto.principal,
      rate: dto.rate,
      term: dto.term,
      amortizationType: dto.amortization_type,
    };
    return this.getPaymentPlanSimulationQuery.execute(request);
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
    const request: SimulateLoanScenariosRequestDto = {
      scenarios: dto.scenarios.map((s) => ({
        name: s.name,
        extraPayment: s.extra_payment,
        startMonth: s.start_month,
        amortizationType: s.amortization_type,
      })),
    };
    return await this.simulateLoanPaymentPlanUseCase.execute(id, request);
  }

  @Patch(':id/approved-amount')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Update loan approved amount',
    description:
      'Allows administrators to adjust the approved amount of a loan. Synchronizes outstanding balance and pending member payments.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: UpdateLoanApprovedAmountHttpDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Loan approved amount updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or business rule violation',
  })
  @ApiNotFoundResponse({
    description: 'Loan not found',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateApprovedAmount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanApprovedAmountHttpDto,
  ): Promise<void> {
    const updateDto: UpdateLoanApprovedAmountDto = {
      loanId: id,
      newApprovedAmount: dto.new_approved_amount,
      changedBy: undefined,
    };
    await this.updateLoanApprovedAmountUseCase.execute(updateDto);
  }

  @Get(':id/transactions')
  @ApiOperation({
    summary: 'Get loan transaction history',
    description:
      'Returns a paginated list of transaction history (payments/disbursements) for a specific loan',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    type: PaginatedResponseHttpDto,
  })
  @ApiNotFoundResponse({
    description: 'Loan not found',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetLoanTransactionsQueryHttpDto,
  ): Promise<PaginatedResponseHttpDto<LoanTransactionResponseHttpDto>> {
    const result = await this.getLoanTransactionsQuery.execute({
      loanId: id,
      page: query.page,
      limit: query.limit,
    });

    return {
      data: result.data.map((t) => ({
        id: t.id,
        loan_id: t.loanId,
        transaction_type: t.transactionType,
        amount: t.amount,
        transaction_date: t.transactionDate,
        notes: t.notes,
        operation_id: t.operationId,
      })),
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    };
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
