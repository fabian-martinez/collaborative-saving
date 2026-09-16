/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CRYPTO_SERVICE } from '@domain/constants/injection-tokens';
import { CryptoService } from './crypto.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CRYPTO_SERVICE,
      useFactory: (configService: ConfigService) =>
        new CryptoService(configService),
      inject: [ConfigService],
    },
    CryptoService,
  ],
  exports: [CRYPTO_SERVICE, CryptoService],
})
export class CryptoModule {}
