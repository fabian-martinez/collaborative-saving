import {
  Controller,
  Get,
  Post,
  Body,
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
  ApiNotFoundResponse,
  ApiBody,
} from '@nestjs/swagger';
import { StocksService } from './stocks.service';
import { Stock } from './entities/stock.entity';
import { MemberStocksResponseDto } from '../members/dto/member-stocks-response.dto';
import { StockTransactionHistoryDto } from '../members/dto/stock-transaction-history.dto';
import { StockWithSubscriptionsDto } from './dto/stock-with-subscriptions.dto';
import { StockModificationDto } from './dto/stock-modification.dto';
// import { StockHistoryRequestDto, StockHistoryResponseDto } from './dto/stock-history.dto';

@ApiTags('Stocks')
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all stocks',
    description:
      'Retrieve all available stocks in the system with subscription counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Stocks retrieved successfully with subscription counts',
    type: [StockWithSubscriptionsDto],
  })
  async findAll(): Promise<StockWithSubscriptionsDto[]> {
    return await this.stocksService.findAllWithSubscriptionCount();
  }

  @Post('modify')
  @ApiOperation({
    summary: 'Process stock modification',
    description:
      'Process stock modifications including exchanges, transfers, and loan payments',
  })
  @ApiBody({ type: StockModificationDto })
  @ApiResponse({
    status: 200,
    description: 'Stock modification processed successfully',
    schema: {
      type: 'object',
      properties: {
        operationId: {
          type: 'string',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
        message: {
          type: 'string',
          example: 'Stock modification processed successfully',
        },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid modification data',
  })
  async processStockModification(@Body() dto: StockModificationDto): Promise<{
    operationId: string;
    message: string;
    details: any;
  }> {
    try {
      return await this.stocksService.processStockModification(dto);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get stock by ID',
    description: 'Retrieve a specific stock by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the stock',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock retrieved successfully',
    type: Stock,
  })
  @ApiNotFoundResponse({
    description: 'Stock not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Stock> {
    try {
      const stock = await this.stocksService.findOne(id);
      if (!stock) {
        throw new HttpException(
          `Stock with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      return stock;
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
    summary: 'Get member stocks summary',
    description:
      'Retrieve a summary of all stocks owned by a specific member using LedgerEntry data',
  })
  @ApiParam({
    name: 'memberId',
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
  async getMemberStockSummary(
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<MemberStocksResponseDto> {
    try {
      return await this.stocksService.getMemberStockSummary(memberId);
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('not found')) {
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

  @Get(':id/member/:memberId/history')
  @ApiOperation({
    summary: 'Get stock transaction history for member',
    description:
      'Retrieve detailed transaction history for a specific stock owned by a specific member using LedgerEntry data',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the stock',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @ApiParam({
    name: 'memberId',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering transactions (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering transactions (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock transaction history retrieved successfully',
    type: StockTransactionHistoryDto,
  })
  @ApiNotFoundResponse({
    description: 'Stock or member not found',
  })
  async getStockTransactionHistory(
    @Param('id', ParseUUIDPipe) stockId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StockTransactionHistoryDto> {
    try {
      // Validate date format if provided
      if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new HttpException(
          'Start date must be in YYYY-MM-DD format',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new HttpException(
          'End date must be in YYYY-MM-DD format',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate that end date is not before start date
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new HttpException(
          'End date cannot be before start date',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.stocksService.getStockTransactionHistory(
        stockId,
        memberId,
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error && error.message?.includes('not found')) {
        throw new HttpException(
          'Stock or member not found',
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
    summary: 'Get organization stocks summary',
    description:
      'Retrieve aggregated statistics for all stocks across the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization stocks summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalStocks: { type: 'number', example: 5 },
        totalValue: { type: 'number', example: 50000 },
        totalMonthlyContributions: { type: 'number', example: 1250 },
        stocksByType: {
          type: 'object',
          properties: {
            'Test Stock 1': { type: 'number', example: 10000 },
            'Test Stock 2': { type: 'number', example: 15000 },
          },
        },
        averageValue: { type: 'number', example: 10000 },
        averageMonthlyContribution: { type: 'number', example: 250 },
      },
    },
  })
  getOrganizationStocksSummary() {
    try {
      // For now, return a placeholder response
      // In the future, implement actual aggregation logic
      return {
        totalStocks: 0,
        totalValue: 0,
        totalMonthlyContributions: 0,
        stocksByType: {},
        averageValue: 0,
        averageMonthlyContribution: 0,
        message: 'Organization stocks summary not yet implemented',
      };
    } catch {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('operations/member/:memberId/meeting/:meetingId')
  @ApiOperation({
    summary: 'Get stock operations for member in meeting',
    description:
      'Retrieve all stock-related operations (modifications, transfers, loan payments) for a specific member in a specific meeting',
  })
  @ApiParam({
    name: 'memberId',
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiParam({
    name: 'meetingId',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock operations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          },
          type: {
            type: 'string',
            example: 'STOCK_MODIFICATION',
          },
          description: {
            type: 'string',
            example: 'Intercambio 1 Accion Fenix → 1 Accion Mini',
          },
          date: { type: 'string', format: 'date-time' },
          details: { type: 'object' },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Member or meeting not found',
  })
  async getStockOperationsForMemberInMeeting(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ) {
    try {
      return await this.stocksService.getStockOperationsForMemberInMeeting(
        memberId,
        meetingId,
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('operations/meeting/:meetingId')
  @ApiOperation({
    summary: 'Get all stock operations for meeting',
    description:
      'Retrieve all stock-related operations (modifications, transfers, loan payments) for all members in a specific meeting',
  })
  @ApiParam({
    name: 'meetingId',
    description: 'The unique identifier of the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'All stock operations for meeting retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          },
          type: {
            type: 'string',
            example: 'STOCK_MODIFICATION',
          },
          description: {
            type: 'string',
            example: 'Intercambio 1 Accion Fenix → 1 Accion Mini',
          },
          date: { type: 'string', format: 'date-time' },
          details: { type: 'object' },
          memberId: {
            type: 'string',
            example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          },
          memberName: {
            type: 'string',
            example: 'Juan Pérez',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Meeting not found',
  })
  async getAllStockOperationsForMeeting(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ) {
    try {
      return await this.stocksService.getAllStockOperationsForMeeting(
        meetingId,
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance/analysis')
  @ApiOperation({
    summary: 'Get stocks performance analysis',
    description:
      'Retrieve performance analysis for all stocks including yield, growth, and trends',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Analysis period (monthly, quarterly, yearly)',
    example: 'yearly',
  })
  @ApiResponse({
    status: 200,
    description: 'Stocks performance analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string', example: 'yearly' },
        analysisDate: { type: 'string', example: '2023-12-31' },
        totalStocks: { type: 'number', example: 5 },
        performanceMetrics: {
          type: 'object',
          properties: {
            averageYield: { type: 'number', example: 8.5 },
            bestPerformer: { type: 'string', example: 'Test Stock 1' },
            worstPerformer: { type: 'string', example: 'Test Stock 2' },
            growthRate: { type: 'number', example: 12.3 },
          },
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  getStocksPerformanceAnalysis(@Query('period') period?: string) {
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
        totalStocks: 0,
        performanceMetrics: {
          averageYield: 0,
          bestPerformer: null,
          worstPerformer: null,
          growthRate: 0,
        },
        recommendations: [],
        message: 'Stocks performance analysis not yet implemented',
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
}
