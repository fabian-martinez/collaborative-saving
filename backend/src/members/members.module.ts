import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { DebtCapacityService } from './debt-capacity.service';
import { Member } from './entities/member.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Operation } from '../operations/entities/operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      LedgerEntry,
      StockSubscription,
      Loan,
      Stock,
      Operation,
    ]),
  ],
  controllers: [MembersController],
  providers: [MembersService, DebtCapacityService],
  exports: [MembersService, DebtCapacityService],
})
export class MembersModule {}
