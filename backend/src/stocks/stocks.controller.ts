import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  @ApiResponse({
    status: 200,
    description: 'A list of all stock types.',
    type: [Stock],
  })
  findAll() {
    return this.stocksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stock type by id' })
  @ApiParam({ name: 'id', description: 'The ID of the stock type' })
  @ApiResponse({ status: 200, description: 'The stock type.', type: Stock })
  @ApiResponse({ status: 404, description: 'Stock type not found.' })
  findOne(@Param('id') id: string) {
    return this.stocksService.findOne(id);
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
  @ApiOperation({ summary: 'Delete a stock type' })
  @ApiParam({ name: 'id', description: 'The ID of the stock type to delete' })
  @ApiResponse({
    status: 200,
    description: 'The stock type has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Stock type not found.' })
  remove(@Param('id') id: string) {
    return this.stocksService.remove(id);
  }
}
