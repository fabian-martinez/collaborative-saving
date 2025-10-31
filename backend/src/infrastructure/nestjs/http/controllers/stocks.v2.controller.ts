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
import { UpdateStockHttpDto } from '../dto/update-stock-http.dto';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';

@ApiTags('Stocks V2')
@Controller('api/v2/stocks')
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
    type: [StockResponseDto],
  })
  async list(): Promise<StockResponseDto[]> {
    try {
      return await this.getStocksQuery.execute();
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
    type: StockResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Stock not found',
  })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StockResponseDto> {
    try {
      return await this.getStockDetailQuery.execute(id);
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
  @ApiOperation({
    summary: 'Create a new stock',
    description: 'Creates a new stock type with the specified parameters',
  })
  @ApiBody({ type: CreateStockHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Stock created successfully',
    type: StockResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - Invalid stock data or stock type already exists',
  })
  async create(@Body() dto: CreateStockHttpDto): Promise<StockResponseDto> {
    try {
      const createDto = {
        type: dto.type,
        value: dto.value,
        monthlyContribution: dto.monthlyContribution,
        isGuaranteed: dto.isGuaranteed,
        guaranteedYield: dto.guaranteedYield,
        behavior: dto.behavior,
      };
      return await this.createStockUseCase.execute(createDto);
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
    type: StockResponseDto,
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
  ): Promise<StockResponseDto> {
    try {
      const updateDto = {
        type: dto.type,
        value: dto.value,
        monthlyContribution: dto.monthlyContribution,
        isGuaranteed: dto.isGuaranteed,
        guaranteedYield: dto.guaranteedYield,
        behavior: dto.behavior,
      };
      return await this.updateStockUseCase.execute(id, updateDto);
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
}
