import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { BuyStockDto } from './dto/buy-stock.dto';

@ApiTags('operations')
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post('buy-stock')
  @ApiOperation({ summary: 'Execute a complex stock purchase operation' })
  buyStock(@Body() buyStockDto: BuyStockDto) {
    return this.operationsService.buyStock(buyStockDto);
  }
}
