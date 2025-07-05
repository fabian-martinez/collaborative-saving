import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StockSubscriptionsService } from './stock-subscriptions.service';
import { CreateStockSubscriptionDto } from './dto/create-stock-subscription.dto';
import { UpdateStockSubscriptionDto } from './dto/update-stock-subscription.dto';
import { StockSubscription } from './entities/stock-subscription.entity';

@ApiTags('stock-subscriptions')
@Controller('stock-subscriptions')
export class StockSubscriptionsController {
  constructor(
    private readonly stockSubscriptionsService: StockSubscriptionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stock subscription' })
  @ApiResponse({
    status: 201,
    description: 'The subscription has been successfully created.',
    type: StockSubscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createStockSubscriptionDto: CreateStockSubscriptionDto) {
    return this.stockSubscriptionsService.create(createStockSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stock subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'A list of all stock subscriptions.',
    type: [StockSubscription],
  })
  findAll() {
    return this.stockSubscriptionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stock subscription by id' })
  @ApiParam({ name: 'id', description: 'The ID of the stock subscription' })
  @ApiResponse({
    status: 200,
    description: 'The stock subscription.',
    type: StockSubscription,
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  findOne(@Param('id') id: string) {
    return this.stockSubscriptionsService.findOne(id);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: "Get a member's active stock subscriptions" })
  @ApiParam({ name: 'memberId', description: "The member's ID" })
  @ApiResponse({
    status: 200,
    description: "A list of the member's active subscriptions.",
    type: [StockSubscription],
  })
  findByMember(@Param('memberId') memberId: string) {
    return this.stockSubscriptionsService.findActiveByMember(memberId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a stock subscription' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the stock subscription to update',
  })
  @ApiResponse({
    status: 200,
    description: 'The subscription has been successfully updated.',
    type: StockSubscription,
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  update(
    @Param('id') id: string,
    @Body() updateStockSubscriptionDto: UpdateStockSubscriptionDto,
  ) {
    return this.stockSubscriptionsService.update(
      id,
      updateStockSubscriptionDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock subscription' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the stock subscription to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'The subscription has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  remove(@Param('id') id: string) {
    return this.stockSubscriptionsService.remove(id);
  }
}
