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
import { MembersService } from './members.service';
import { DebtCapacityService } from './debt-capacity.service';
import { MemberDetailResponseDto } from './dto/member-detail-response.dto';
import { MemberStocksResponseDto } from './dto/member-stocks-response.dto';
import { MemberLoansResponseDto } from './dto/member-loans-response.dto';
import { DebtCapacityResponseDto } from './dto/debt-capacity-response.dto';
import { MemberSummaryResponseDto } from './dto/member-summary-response.dto';
import { StockTransactionHistoryDto } from './dto/stock-transaction-history.dto';
import { LoanInstallmentsDto } from './dto/loan-installments.dto';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly debtCapacityService: DebtCapacityService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all members',
    description: 'Retrieve a list of all members',
  })
  @ApiResponse({
    status: 200,
    description: 'Members list retrieved successfully',
    type: [MemberDetailResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getAllMembers(): Promise<MemberDetailResponseDto[]> {
    try {
      const members = await this.membersService.findAll();
      // Convertir cada miembro a MemberDetailResponseDto
      const memberDetails = await Promise.all(
        members.map((member) => this.membersService.getMemberDetail(member.id)),
      );
      return memberDetails;
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get member detail',
    description: 'Retrieve detailed information about a specific member',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member detail retrieved successfully',
    type: MemberDetailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid member ID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getMemberDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberDetailResponseDto> {
    try {
      return await this.membersService.getMemberDetail(id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Member with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/stocks')
  @ApiOperation({
    summary: 'Get member stocks summary',
    description: 'Retrieve a summary of all stocks owned by a member',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member stocks summary retrieved successfully',
    type: MemberStocksResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  async getMemberStocks(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberStocksResponseDto> {
    try {
      return await this.membersService.getMemberStocks(id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Member with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/loans')
  @ApiOperation({
    summary: 'Get member loans summary',
    description: 'Retrieve a summary of all loans for a member',
  })
  @ApiParam({
    name: 'id',
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
  async getMemberLoans(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberLoansResponseDto> {
    try {
      return await this.membersService.getMemberLoans(id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Member with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/debt-capacity')
  @ApiOperation({
    summary: 'Calculate member debt capacity',
    description: 'Calculate the debt capacity and credit status for a member',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Debt capacity calculated successfully',
    type: DebtCapacityResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  async getMemberDebtCapacity(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DebtCapacityResponseDto> {
    try {
      return await this.debtCapacityService.calculateDebtCapacity(id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Member with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/summary')
  @ApiOperation({
    summary: 'Get complete member summary',
    description: 'Retrieve a consolidated summary of all member information including stocks, loans, and debt capacity',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member summary retrieved successfully',
    type: MemberSummaryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  async getMemberSummary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberSummaryResponseDto> {
    try {
      return await this.membersService.getMemberSummary(id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Member with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/stocks/:stockId/history')
  @ApiOperation({
    summary: 'Get stock transaction history',
    description: 'Retrieve detailed transaction history for a specific stock owned by a member',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiParam({
    name: 'stockId',
    description: 'The unique identifier of the stock',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock transaction history retrieved successfully',
    type: StockTransactionHistoryDto,
  })
  @ApiNotFoundResponse({
    description: 'Member or stock not found',
  })
  async getStockTransactionHistory(
    @Param('id', ParseUUIDPipe) memberId: string,
    @Param('stockId', ParseUUIDPipe) stockId: string,
  ): Promise<StockTransactionHistoryDto> {
    try {
      return await this.membersService.getStockTransactionHistory(stockId, memberId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          'Member or stock not found',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/loans/:loanId/installments')
  @ApiOperation({
    summary: 'Get loan installments',
    description: 'Retrieve detailed installments information for a specific loan',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiParam({
    name: 'loanId',
    description: 'The unique identifier of the loan',
    example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan installments retrieved successfully',
    type: LoanInstallmentsDto,
  })
  @ApiNotFoundResponse({
    description: 'Member or loan not found',
  })
  async getLoanInstallments(
    @Param('id', ParseUUIDPipe) memberId: string,
    @Param('loanId', ParseUUIDPipe) loanId: string,
  ): Promise<LoanInstallmentsDto> {
    try {
      return await this.membersService.getLoanInstallments(loanId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          'Member or loan not found',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }





  @Get('debt-capacity/summary')
  @ApiOperation({
    summary: 'Get debt capacity summary for multiple members',
    description: 'Retrieve debt capacity information for multiple members',
  })
  @ApiQuery({
    name: 'memberIds',
    required: true,
    description: 'Comma-separated list of member IDs',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11,b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @ApiResponse({
    status: 200,
    description: 'Debt capacity summary retrieved successfully',
    type: [DebtCapacityResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid member IDs format',
  })
  async getDebtCapacitySummary(
    @Query('memberIds') memberIds: string,
  ): Promise<DebtCapacityResponseDto[]> {
    try {
      if (!memberIds) {
        throw new HttpException(
          'memberIds query parameter is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const ids = memberIds.split(',').map(id => id.trim());
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const id of ids) {
        if (!uuidRegex.test(id)) {
          throw new HttpException(
            `Invalid UUID format: ${id}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      return await this.debtCapacityService.getDebtCapacitySummary(ids);
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

  @Get('debt-capacity/organization-stats')
  @ApiOperation({
    summary: 'Get organization debt capacity statistics',
    description: 'Retrieve aggregated debt capacity statistics for the entire organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization debt capacity statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalMembers: { type: 'number', example: 25 },
        totalSavings: { type: 'number', example: 125000 },
        totalCredits: { type: 'number', example: 75000 },
        averageUtilization: { type: 'number', example: 60.5 },
        membersByCreditStatus: {
          type: 'object',
          properties: {
            excellent: { type: 'number', example: 10 },
            good: { type: 'number', example: 8 },
            moderate: { type: 'number', example: 4 },
            high: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  async getOrganizationDebtCapacityStats() {
    try {
      return await this.debtCapacityService.getOrganizationDebtCapacityStats();
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
