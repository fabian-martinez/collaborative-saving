import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
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
import { CreateStockUseCase } from '@application/use-cases/stocks/create-stock.use-case';
import { UpdateStockUseCase } from '@application/use-cases/stocks/update-stock.use-case';
import { GetStocksQueryHandler } from '@application/queries/stocks/get-stocks.query-handler';
import { GetStockDetailQueryHandler } from '@application/queries/stocks/get-stock-detail.query-handler';
import { CreateStockHttpDto } from '../dto/create-stock-http.dto';
import { CreateStockDto } from '@application/dto/stocks/create-stock.dto';
import { UpdateStockHttpDto } from '../dto/update-stock-http.dto';
import { StockResponseHttpDto } from '../dto/stock-response-http.dto';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';

@ApiTags('Stocks V2')
@Controller('v2/stocks')
export class StocksV2Controller {
  constructor(
    private readonly getStocksQuery: GetStocksQueryHandler,
    private readonly getStockDetailQuery: GetStockDetailQueryHandler,
    private readonly createStockUseCase: CreateStockUseCase,
    private readonly updateStockUseCase: UpdateStockUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all stocks',
    description: 'Retrieve all active stocks in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Stocks retrieved successfully',
    type: [StockResponseHttpDto],
    examples: {
      example: {
        summary: 'List of stocks',
        value: [
          {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            type: 'Acción A',
            value: 100000,
            monthlyContribution: 50000,
            isGuaranteed: true,
            guaranteedYield: 0.05,
            behavior: 'CAPITAL_APPRECIATION',
            createdAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
            type: 'Acción B',
            value: 200000,
            monthlyContribution: 75000,
            isGuaranteed: false,
            guaranteedYield: null,
            behavior: 'DIVIDEND_YIELD',
            createdAt: '2024-02-20T14:20:00Z',
          },
        ],
      },
    },
  })
  async list(): Promise<StockResponseHttpDto[]> {
    try {
      const stocks = await this.getStocksQuery.execute();
      return stocks.map((stock) => this.mapStockToHttp(stock));
    } catch (error: unknown) {
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
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock retrieved successfully',
    type: StockResponseHttpDto,
    examples: {
      example: {
        summary: 'Stock details',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          type: 'Acción A',
          value: 100000,
          monthlyContribution: 50000,
          isGuaranteed: true,
          guaranteedYield: 0.05,
          behavior: 'CAPITAL_APPRECIATION',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Stock not found',
  })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StockResponseHttpDto> {
    try {
      const stock = await this.getStockDetailQuery.execute(id);
      return this.mapStockToHttp(stock);
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

  @Post()
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new stock',
    description: 'Creates a new stock type with the specified parameters',
  })
  @ApiBody({ type: CreateStockHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Stock created successfully',
    type: StockResponseHttpDto,
    examples: {
      example: {
        summary: 'Created stock',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          type: 'Acción A',
          value: 100000,
          monthlyContribution: 50000,
          isGuaranteed: true,
          guaranteedYield: 0.05,
          behavior: 'CAPITAL_APPRECIATION',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - Invalid stock data or stock type already exists',
  })
  async create(@Body() dto: CreateStockHttpDto): Promise<StockResponseHttpDto> {
    try {
      const createDto: CreateStockDto = {
        type: dto.type,
        value: dto.value,
        monthlyContribution: dto.monthly_contribution,
        isGuaranteed: dto.is_guaranteed,
        guaranteedYield: dto.guaranteed_yield,
        behavior: dto.behavior,
      };
      const result = await this.createStockUseCase.execute(createDto);
      return this.mapStockToHttp(result);
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

  @Patch(':id')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Update a stock',
    description: 'Updates an existing stock with the specified parameters',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: UpdateStockHttpDto })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    type: StockResponseHttpDto,
    examples: {
      example: {
        summary: 'Updated stock',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          type: 'Acción A Actualizada',
          value: 120000,
          monthlyContribution: 60000,
          isGuaranteed: true,
          guaranteedYield: 0.06,
          behavior: 'CAPITAL_APPRECIATION',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Stock not found',
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - Invalid stock data or stock type already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockHttpDto,
  ): Promise<StockResponseHttpDto> {
    try {
      const updateDto = {
        type: dto.type,
        value: dto.value,
        monthlyContribution: dto.monthly_contribution,
        isGuaranteed: dto.is_guaranteed,
        guaranteedYield: dto.guaranteed_yield,
        behavior: dto.behavior,
      };
      const result = await this.updateStockUseCase.execute(id, updateDto);
      return this.mapStockToHttp(result);
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

  private mapStockToHttp(stock: StockResponseDto): StockResponseHttpDto {
    return {
      id: stock.id,
      type: stock.type,
      value: stock.value,
      monthly_contribution: stock.monthlyContribution,
      is_guaranteed: stock.isGuaranteed,
      guaranteed_yield: stock.guaranteedYield,
      behavior: stock.behavior,
      created_at: stock.createdAt,
    };
  }
}
