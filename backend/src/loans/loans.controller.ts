import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { MemberLoansResponseDto } from '../members/dto/member-loans-response.dto';
import { LoanInstallmentsDto } from '../members/dto/loan-installments.dto';

@ApiTags('Loans')
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all loans',
    description: 'Retrieve all loans in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Loans retrieved successfully',
    type: [Loan],
  })
  async findAll(): Promise<Loan[]> {
    try {
      return await this.loansService.findAll();
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get loan by ID',
    description: 'Retrieve a specific loan by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the loan',
    example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan retrieved successfully',
    type: Loan,
  })
  @ApiNotFoundResponse({
    description: 'Loan not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Loan> {
    try {
      const loan = await this.loansService.findOne(id);
      if (!loan) {
        throw new HttpException(
          `Loan with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      return loan;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('member/:memberId/summary')
  @ApiOperation({
    summary: 'Get member loans summary',
    description: 'Retrieve a summary of all loans for a specific member using LedgerEntry data',
  })
  @ApiParam({
    name: 'memberId',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member loans summary retrieved successfully',
    type: MemberLoansResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  async getMemberLoanSummary(
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<MemberLoansResponseDto> {
    try {
      return await this.loansService.getMemberLoanSummary(memberId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Member with ID ${memberId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('member/:memberId/active')
  @ApiOperation({
    summary: 'Get active loans for a member',
    description: 'Retrieve all active loans for a specific member',
  })
  @ApiParam({
    name: 'memberId',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Active loans retrieved successfully',
    type: [Loan],
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  async findActiveByMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<Loan[]> {
    try {
      return await this.loansService.findActiveByMember(memberId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Member with ID ${memberId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/installments')
  @ApiOperation({
    summary: 'Get loan installments',
    description: 'Retrieve detailed installments information for a specific loan using LedgerEntry data',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the loan',
    example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  })
  @ApiQuery({
    name: 'includePaid',
    required: false,
    description: 'Include paid installments in the response',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Loan installments retrieved successfully',
    type: LoanInstallmentsDto,
  })
  @ApiNotFoundResponse({
    description: 'Loan not found',
  })
  async getLoanInstallments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includePaid') includePaid?: string,
  ): Promise<LoanInstallmentsDto> {
    try {
      const includePaidBool = includePaid === 'true';
      return await this.loansService.getLoanInstallments(id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Loan with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organization/summary')
  @ApiOperation({
    summary: 'Get organization loans summary',
    description: 'Retrieve aggregated statistics for all loans across the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization loans summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalLoans: { type: 'number', example: 15 },
        totalApprovedAmount: { type: 'number', example: 150000 },
        totalOutstandingBalance: { type: 'number', example: 75000 },
        totalMonthlyPayments: { type: 'number', example: 3750 },
        averageLoanAmount: { type: 'number', example: 10000 },
        averageInterestRate: { type: 'number', example: 2.5 },
        loansByStatus: {
          type: 'object',
          properties: {
            active: { type: 'number', example: 12 },
            paid: { type: 'number', example: 2 },
            defaulted: { type: 'number', example: 1 },
          },
        },
        loansByType: {
          type: 'object',
          properties: {
            corriente: { type: 'number', example: 10 },
            hipotecario: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async getOrganizationLoansSummary() {
    try {
      // For now, return a placeholder response
      // In the future, implement actual aggregation logic
      return {
        totalLoans: 0,
        totalApprovedAmount: 0,
        totalOutstandingBalance: 0,
        totalMonthlyPayments: 0,
        averageLoanAmount: 0,
        averageInterestRate: 0,
        loansByStatus: {},
        loansByType: {},
        message: 'Organization loans summary not yet implemented',
      };
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance/analysis')
  @ApiOperation({
    summary: 'Get loans performance analysis',
    description: 'Retrieve performance analysis for all loans including default rates, payment trends, and risk assessment',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Analysis period (monthly, quarterly, yearly)',
    example: 'yearly',
  })
  @ApiResponse({
    status: 200,
    description: 'Loans performance analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string', example: 'yearly' },
        analysisDate: { type: 'string', example: '2023-12-31' },
        totalLoans: { type: 'number', example: 15 },
        performanceMetrics: {
          type: 'object',
          properties: {
            defaultRate: { type: 'number', example: 6.7 },
            averagePaymentRate: { type: 'number', example: 95.2 },
            totalInterestCollected: { type: 'number', example: 12500 },
            averageLoanTerm: { type: 'number', example: 24 },
          },
        },
        riskAssessment: {
          type: 'object',
          properties: {
            lowRisk: { type: 'number', example: 8 },
            mediumRisk: { type: 'number', example: 5 },
            highRisk: { type: 'number', example: 2 },
          },
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getLoansPerformanceAnalysis(@Query('period') period?: string) {
    try {
      const validPeriods = ['monthly', 'quarterly', 'yearly'];
      if (period && !validPeriods.includes(period)) {
        throw new HttpException(
          'Period must be one of: monthly, quarterly, yearly',
          HttpStatus.BAD_REQUEST,
        );
      }

      // For now, return a placeholder response
      // In the future, implement actual performance analysis logic
      return {
        period: period || 'yearly',
        analysisDate: new Date().toISOString().split('T')[0],
        totalLoans: 0,
        performanceMetrics: {
          defaultRate: 0,
          averagePaymentRate: 0,
          totalInterestCollected: 0,
          averageLoanTerm: 0,
        },
        riskAssessment: {
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0,
        },
        recommendations: [],
        message: 'Loans performance analysis not yet implemented',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('risk/assessment')
  @ApiOperation({
    summary: 'Get loans risk assessment',
    description: 'Retrieve comprehensive risk assessment for all loans including credit scores, collateral analysis, and default probability',
  })
  @ApiResponse({
    status: 200,
    description: 'Loans risk assessment retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        assessmentDate: { type: 'string', example: '2023-12-31' },
        totalLoans: { type: 'number', example: 15 },
        riskDistribution: {
          type: 'object',
          properties: {
            low: { type: 'number', example: 8 },
            medium: { type: 'number', example: 5 },
            high: { type: 'number', example: 2 },
          },
        },
        defaultProbability: { type: 'number', example: 6.7 },
        averageCreditScore: { type: 'number', example: 750 },
        collateralCoverage: { type: 'number', example: 85.5 },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getLoansRiskAssessment() {
    try {
      // For now, return a placeholder response
      // In the future, implement actual risk assessment logic
      return {
        assessmentDate: new Date().toISOString().split('T')[0],
        totalLoans: 0,
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0,
        },
        defaultProbability: 0,
        averageCreditScore: 0,
        collateralCoverage: 0,
        recommendations: [],
        message: 'Loans risk assessment not yet implemented',
      };
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
