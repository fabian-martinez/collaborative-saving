import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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
import { GetMemberLoansQueryHandler } from '@application/queries/loans/get-member-loans.query-handler';
import { UpdateLoanTermsUseCase } from '@application/use-cases/loans/update-loan-terms.use-case';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';
import { LoanResponseHttpDto } from '../dto/loan-response-http.dto';
import { UpdateLoanTermsHttpDto } from '../dto/update-loan-terms-http.dto';
import { UpdateLoanTermsDto } from '@application/dto/loans/update-loan-terms.dto';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

@ApiTags('Loans V2')
@Controller('v2/loans')
export class LoansV2Controller {
  constructor(
    private readonly getLoansQuery: GetLoansQueryHandler,
    private readonly getLoanDetailQuery: GetLoanDetailQueryHandler,
    private readonly getMemberLoansQuery: GetMemberLoansQueryHandler,
    private readonly updateLoanTermsUseCase: UpdateLoanTermsUseCase,
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
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('member/:memberId')
  @ApiOperation({
    summary: 'Get all loans for a member',
    description: 'Returns all loans belonging to a specific member',
  })
  @ApiParam({
    name: 'memberId',
    description: 'The unique identifier of the member',
    example: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
  })
  @ApiResponse({
    status: 200,
    description: 'Member loans retrieved successfully',
    type: [LoanResponseHttpDto],
  })
  async findByMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<LoanResponseHttpDto[]> {
    try {
      const loans = await this.getMemberLoansQuery.execute(memberId);
      return loans.map((loan) => this.mapLoanToHttp(loan));
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/terms')
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
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof InvalidRequestError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
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

