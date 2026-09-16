/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ValueTransformer } from 'typeorm';
import { CryptoServicePort } from '@domain/ports/services/crypto-service.port';
import { CryptoService } from '../../services/crypto/crypto.service';

export class EncryptionTransformer implements ValueTransformer {
  constructor(private readonly cryptoService?: CryptoServicePort) {}

  private getService(): CryptoServicePort {
    return this.cryptoService ?? CryptoService.getInstance();
  }

  to(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined || value === '') {
      return value;
    }
    return this.getService().encrypt(value);
  }

  from(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined || value === '') {
      return value;
    }
    return this.getService().decrypt(value);
  }
}

export const encryptionTransformer = new EncryptionTransformer();
