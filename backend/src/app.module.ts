import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersV2Module } from './infrastructure/nestjs/http/modules/members-v2.module';
import { StocksV2Module } from './infrastructure/nestjs/http/modules/stocks-v2.module';
import { MeetingsV2Module } from './infrastructure/nestjs/http/modules/meetings-v2.module';
import { MandatoryContributionsV2Module } from './infrastructure/nestjs/http/modules/mandatory-contributions-v2.module';
import { LoansV2Module } from './infrastructure/nestjs/http/modules/loans-v2.module';
import { AccountingV2Module } from './infrastructure/nestjs/http/modules/accounting-v2.module';
import { EventBusModule } from './infrastructure/services/event-bus/event-bus.module';
import { TransactionManagerModule } from './infrastructure/services/transaction-manager/transaction-manager.module';
import { FirebaseAdminModule } from './infrastructure/services/firebase-admin/firebase-admin.module';
import { FirebaseAuthGuard } from './infrastructure/nestjs/auth/guards/firebase-auth.guard';
import { RolesGuard } from './infrastructure/nestjs/auth/guards/roles.guard';

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
    FirebaseAdminModule,
    MembersV2Module,
    StocksV2Module,
    MeetingsV2Module,
    MandatoryContributionsV2Module,
    LoansV2Module,
    AccountingV2Module,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
