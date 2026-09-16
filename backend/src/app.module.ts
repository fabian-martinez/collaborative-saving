import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersV2Module } from './infrastructure/nestjs/http/modules/members-v2.module';
import { StocksV2Module } from './infrastructure/nestjs/http/modules/stocks-v2.module';
import { MeetingsV2Module } from './infrastructure/nestjs/http/modules/meetings-v2.module';
import { MandatoryContributionsV2Module } from './infrastructure/nestjs/http/modules/mandatory-contributions-v2.module';
import { LoansV2Module } from './infrastructure/nestjs/http/modules/loans-v2.module';
import { AccountingV2Module } from './infrastructure/nestjs/http/modules/accounting-v2.module';
import { PendingPaymentsV2Module } from './infrastructure/nestjs/http/modules/pending-payments-v2.module';
import { DashboardV2Module } from './infrastructure/nestjs/http/modules/dashboard-v2.module';
import { SettingsV2Module } from './infrastructure/nestjs/http/modules/settings-v2.module';
import { EventBusModule } from './infrastructure/services/event-bus/event-bus.module';
import { TransactionManagerModule } from './infrastructure/services/transaction-manager/transaction-manager.module';
import { CryptoModule } from './infrastructure/services/crypto/crypto.module';
import { FirebaseAdminModule } from './infrastructure/services/firebase-admin/firebase-admin.module';
import { AuthModule } from './infrastructure/services/auth/auth.module';
import { AuthV2Module } from './infrastructure/nestjs/http/modules/auth-v2.module';
import { FirebaseAuthGuard } from './infrastructure/nestjs/auth/guards/firebase-auth.guard';
import { RolesGuard } from './infrastructure/nestjs/auth/guards/roles.guard';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnvConfig } from './infrastructure/config/env.validation';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvConfig,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl =
          configService.get<string>('DATABASE_TEST_URL') ||
          configService.get<string>('DATABASE_URL') ||
          '';
        const isSsl =
          configService.get<string>('DATABASE_SSL') === 'true' ||
          dbUrl.includes('neon.tech') ||
          dbUrl.includes('sslmode=require');

        return {
          type: 'postgres',
          url: dbUrl,
          autoLoadEntities: true,
          synchronize: false,
          ssl: isSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    CryptoModule,
    EventBusModule,
    TransactionManagerModule,
    FirebaseAdminModule,
    AuthModule,
    AuthV2Module,
    MembersV2Module,
    StocksV2Module,
    MeetingsV2Module,
    MandatoryContributionsV2Module,
    LoansV2Module,
    AccountingV2Module,
    PendingPaymentsV2Module,
    DashboardV2Module,
    SettingsV2Module,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
