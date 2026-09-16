/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Test } from '@nestjs/testing';
import { CryptoModule } from './crypto.module';
import { CryptoService } from './crypto.service';
import { CRYPTO_SERVICE } from '@domain/constants/injection-tokens';
import { CryptoServicePort } from '@domain/ports/services/crypto-service.port';

describe('CryptoModule', () => {
  it('should compile and resolve dependencies successfully', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CryptoModule],
    }).compile();

    expect(moduleRef).toBeDefined();

    const cryptoServiceByToken =
      moduleRef.get<CryptoServicePort>(CRYPTO_SERVICE);
    expect(cryptoServiceByToken).toBeDefined();

    const cryptoServiceByClass = moduleRef.get<CryptoService>(CryptoService);
    expect(cryptoServiceByClass).toBeDefined();
    expect(cryptoServiceByClass).toBe(cryptoServiceByToken);
  });
});
