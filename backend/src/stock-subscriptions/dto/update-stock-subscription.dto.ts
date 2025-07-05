import { PartialType } from '@nestjs/swagger';
import { CreateStockSubscriptionDto } from './create-stock-subscription.dto';

export class UpdateStockSubscriptionDto extends PartialType(
  CreateStockSubscriptionDto,
) {}
