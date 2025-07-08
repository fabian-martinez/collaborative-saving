import { Module, forwardRef } from '@nestjs/common';
import { DuesService } from './dues.service';
import { DuesController } from './dues.controller';
import { MeetingsModule } from '../meetings/meetings.module';
import { MandatoryContributionsModule } from '../mandatory-contributions/mandatory-contributions.module';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
    forwardRef(() => MeetingsModule),
    MandatoryContributionsModule,
    StockSubscriptionsModule,
    LoansModule,
  ],
  providers: [DuesService],
  controllers: [DuesController],
  exports: [DuesService],
})
export class DuesModule {}
