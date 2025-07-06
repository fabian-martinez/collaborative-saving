import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StocksService } from './stocks.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock } from './entities/stock.entity';

@ApiTags('stocks')
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stock type' })
  @ApiResponse({
    status: 201,
    description: 'The stock type has been successfully created.',
    type: Stock,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createStockDto: CreateStockDto) {
    return this.stocksService.create(createStockDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stock types' })
  @ApiQuery({
    name: 'withDeleted',
    required: false,
    description: 'If true, the result will include soft-deleted stocks.',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'A list of all stock types.',
    type: [Stock],
  })
  findAll(
    @Query('withDeleted', new ParseBoolPipe({ optional: true }))
    withDeleted?: boolean,
  ) {
    return this.stocksService.findAll(withDeleted);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted stock types' })
  @ApiResponse({
    status: 200,
    description: 'A list of all soft-deleted stock types.',
    type: [Stock],
  })
  findOnlyDeleted() {
    return this.stocksService.findOnlyDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stock type by id' })
  @ApiParam({ name: 'id', description: 'The ID of the stock type' })
  @ApiQuery({
    name: 'withDeleted',
    required: false,
    description: 'If true, the result will include soft-deleted stocks.',
    type: Boolean,
  })
  @ApiResponse({ status: 200, description: 'The stock type.', type: Stock })
  @ApiResponse({ status: 404, description: 'Stock type not found.' })
  findOne(
    @Param('id') id: string,
    @Query('withDeleted', new ParseBoolPipe({ optional: true }))
    withDeleted?: boolean,
  ) {
    return this.stocksService.findOne(id, withDeleted);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a stock type' })
  @ApiParam({ name: 'id', description: 'The ID of the stock type to update' })
  @ApiResponse({
    status: 200,
    description: 'The stock type has been successfully updated.',
    type: Stock,
  })
  @ApiResponse({ status: 404, description: 'Stock type not found.' })
  update(@Param('id') id: string, @Body() updateStockDto: UpdateStockDto) {
    return this.stocksService.update(id, updateStockDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a stock type' })
  @ApiParam({ name: 'id', description: 'The ID of the stock type to delete' })
  @ApiResponse({
    status: 204,
    description: 'The stock type has been successfully soft-deleted.',
  })
  @ApiResponse({ status: 404, description: 'Stock type not found.' })
  remove(@Param('id') id: string) {
    return this.stocksService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted stock type' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the stock type to restore',
  })
  @ApiResponse({
    status: 200,
    description: 'The stock type has been successfully restored.',
  })
  @ApiResponse({ status: 404, description: 'Stock type not found.' })
  restore(@Param('id') id: string) {
    return this.stocksService.restore(id);
  }
}
