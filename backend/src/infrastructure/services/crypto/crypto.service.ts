/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CryptoServicePort } from '@domain/ports/services/crypto-service.port';
import { parseEncryptionKey } from '../../config/env.validation';

@Injectable()
export class CryptoService implements CryptoServicePort {
  private static instance: CryptoService;
  private readonly encryptionKey: Buffer;
  private readonly blindIndexSalt: string;

  constructor(
    @Optional() private readonly configService?: ConfigService,
    encryptionKeyOverride?: string,
    blindIndexSaltOverride?: string,
  ) {
    const rawKey =
      encryptionKeyOverride ??
      this.configService?.get<string>('APP_ENCRYPTION_KEY') ??
      process.env.APP_ENCRYPTION_KEY ??
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const rawSalt =
      blindIndexSaltOverride ??
      this.configService?.get<string>('APP_BLIND_INDEX_SALT') ??
      process.env.APP_BLIND_INDEX_SALT ??
      'default_salt_for_collaborative_saving_blind_index_2026';

    this.encryptionKey = parseEncryptionKey(rawKey);
    this.blindIndexSalt = rawSalt;

    CryptoService.instance = this;
  }

  /**
   * Returns the singleton instance of CryptoService.
   * Useful for TypeORM Column Transformers initialized at metadata load time.
   */
  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  public encrypt(
    plaintext: string | null | undefined,
  ): string | null | undefined {
    if (plaintext === null || plaintext === undefined) {
      return plaintext;
    }
    if (plaintext === '') {
      return '';
    }
    if (this.isEncrypted(plaintext)) {
      return plaintext;
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  public decrypt(
    ciphertext: string | null | undefined,
  ): string | null | undefined {
    if (ciphertext === null || ciphertext === undefined) {
      return ciphertext;
    }
    if (ciphertext === '') {
      return '';
    }

    const isVersionedPayload =
      typeof ciphertext === 'string' &&
      /^v[0-9]+:[0-9a-fA-F]{24}:[0-9a-fA-F]{32}:[0-9a-fA-F]*$/.test(ciphertext);

    if (!isVersionedPayload) {
      // Return legacy or unencrypted text without crashing
      return ciphertext;
    }

    const parts = ciphertext.split(':');
    const version = parts[0];
    const ivHex = parts[1];
    const tagHex = parts[2];
    const dataHex = parts[3];

    if (version !== 'v1') {
      throw new Error(`Unsupported encryption payload version: ${version}`);
    }

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Failed to decrypt ciphertext: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public hashBlindIndex(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    if (value === '') {
      return '';
    }

    const normalized = value.trim();
    return crypto
      .createHmac('sha256', this.blindIndexSalt)
      .update(normalized)
      .digest('hex');
  }

  public isEncrypted(value: string | null | undefined): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const parts = value.split(':');
    if (parts.length !== 4) {
      return false;
    }

    const [version, ivHex, tagHex, dataHex] = parts;

    return (
      version === 'v1' &&
      ivHex.length === 24 &&
      /^[0-9a-fA-F]{24}$/.test(ivHex) &&
      tagHex.length === 32 &&
      /^[0-9a-fA-F]{32}$/.test(tagHex) &&
      /^[0-9a-fA-F]*$/.test(dataHex)
    );
  }
}
