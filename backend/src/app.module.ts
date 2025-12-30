import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersV2Module } from './infrastructure/nestjs/http/modules/members-v2.module';
import { StocksV2Module } from './infrastructure/nestjs/http/modules/stocks-v2.module';
import { MeetingsV2Module } from './infrastructure/nestjs/http/modules/meetings-v2.module';
import { MandatoryContributionsV2Module } from './infrastructure/nestjs/http/modules/mandatory-contributions-v2.module';
import { LoansV2Module } from './infrastructure/nestjs/http/modules/loans-v2.module';
import { EventBusModule } from './infrastructure/services/event-bus/event-bus.module';
import { TransactionManagerModule } from './infrastructure/services/transaction-manager/transaction-manager.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, // Recommended to be false in production
    }),
    EventBusModule,
    TransactionManagerModule,
    MembersV2Module,
    StocksV2Module,
    MeetingsV2Module,
    MandatoryContributionsV2Module,
    LoansV2Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
