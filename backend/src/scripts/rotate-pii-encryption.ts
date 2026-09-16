/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
import { CryptoService } from '../infrastructure/services/crypto/crypto.service';

interface MemberRow {
  id: string;
  name: string;
  email: string | null;
  identification_number: string | null;
  phone: string | null;
  address: string | null;
  beneficiary: string | null;
  email_hash: string | null;
  identification_number_hash: string | null;
}

export async function rotatePiiEncryption(
  targetDbUrl: string,
  oldKey: string,
  oldSalt: string,
  newKey: string,
  newSalt: string,
) {
  const isSsl =
    targetDbUrl.includes('neon.tech') ||
    targetDbUrl.includes('sslmode=require') ||
    process.env.DATABASE_SSL === 'true';

  console.log(
    `[PII-Rotation] Target DB: ${targetDbUrl.replace(/:[^:@]+@/, ':****@')}`,
  );
  console.log(`[PII-Rotation] SSL: ${isSsl ? 'enabled' : 'disabled'}`);

  const client = new Client({
    connectionString: targetDbUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('[PII-Rotation] Connected to database.');

  const oldCrypto = new CryptoService(undefined, oldKey, oldSalt);
  const newCrypto = new CryptoService(undefined, newKey, newSalt);

  try {
    const res = await client.query<MemberRow>(
      `SELECT id, name, email, identification_number, phone, address, beneficiary, email_hash, identification_number_hash 
       FROM public.members ORDER BY id;`,
    );

    console.log(
      `[PII-Rotation] Found ${res.rows.length} members to re-encrypt.`,
    );

    let updatedCount = 0;
    for (const row of res.rows) {
      // Helper to decrypt field: try old key, fallback to new key, or plaintext
      const decryptField = (
        val: string | null | undefined,
      ): string | null | undefined => {
        if (!val) return val;
        if (oldCrypto.isEncrypted(val)) {
          const dec = oldCrypto.decrypt(val);
          if (dec && dec !== val) return dec;
        }
        if (newCrypto.isEncrypted(val)) {
          const dec = newCrypto.decrypt(val);
          if (dec && dec !== val) return dec;
        }
        return val;
      };

      const plainEmail = decryptField(row.email);
      const plainId = decryptField(row.identification_number);
      const plainPhone = decryptField(row.phone);
      const plainAddress = decryptField(row.address);
      const plainBeneficiary = decryptField(row.beneficiary);

      const newEmail = plainEmail ? newCrypto.encrypt(plainEmail) : plainEmail;
      const newEmailHash = plainEmail
        ? newCrypto.hashBlindIndex(plainEmail.toLowerCase().trim())
        : null;

      const newIdNum = plainId ? newCrypto.encrypt(plainId) : plainId;
      const newIdHash = plainId
        ? newCrypto.hashBlindIndex(plainId.trim())
        : null;

      const newPhone = plainPhone ? newCrypto.encrypt(plainPhone) : plainPhone;
      const newAddress = plainAddress
        ? newCrypto.encrypt(plainAddress)
        : plainAddress;
      const newBeneficiary = plainBeneficiary
        ? newCrypto.encrypt(plainBeneficiary)
        : plainBeneficiary;

      await client.query(
        `UPDATE public.members 
         SET email = $1, email_hash = $2, identification_number = $3, identification_number_hash = $4,
             phone = $5, address = $6, beneficiary = $7
         WHERE id = $8;`,
        [
          newEmail,
          newEmailHash,
          newIdNum,
          newIdHash,
          newPhone,
          newAddress,
          newBeneficiary,
          row.id,
        ],
      );
      updatedCount++;
      console.log(`[PII-Rotation] Re-encrypted member ${row.id} (${row.name})`);
    }

    console.log(
      `[PII-Rotation] Successfully re-encrypted ${updatedCount} members with new key.`,
    );

    // Verification step
    const verifyRes = await client.query<MemberRow>(
      `SELECT id, name, email, identification_number, email_hash, identification_number_hash 
       FROM public.members ORDER BY id;`,
    );

    let verifyErrors = 0;
    for (const vRow of verifyRes.rows) {
      if (vRow.email) {
        const decEmail = newCrypto.decrypt(vRow.email);
        if (!decEmail || decEmail.startsWith('v1:')) {
          console.error(
            `[PII-Rotation] Verification failed for email of member ${vRow.id}`,
          );
          verifyErrors++;
        }
        const expectedHash = newCrypto.hashBlindIndex(
          decEmail?.toLowerCase().trim(),
        );
        if (expectedHash !== vRow.email_hash) {
          console.error(
            `[PII-Rotation] Verification hash mismatch for member ${vRow.id}`,
          );
          verifyErrors++;
        }
      }
    }

    if (verifyErrors > 0) {
      throw new Error(
        `[PII-Rotation] Rotation verification encountered ${verifyErrors} errors.`,
      );
    }

    console.log(
      '[PII-Rotation] Verification complete: All members verified with new key & salt!',
    );
  } finally {
    await client.end();
    console.log('[PII-Rotation] Database connection closed.');
  }
}

// CLI invocation
if (require.main === module) {
  const targetDbUrl =
    process.argv[2] ||
    process.env.TARGET_DB_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/restored_db_feb21';

  const oldKey =
    process.env.OLD_ENCRYPTION_KEY ||
    process.env.APP_ENCRYPTION_KEY_OLD ||
    '0000000000000000000000000000000000000000000000000000000000000000';
  const oldSalt =
    process.env.OLD_BLIND_INDEX_SALT ||
    process.env.APP_BLIND_INDEX_SALT_OLD ||
    'default_dev_salt_placeholder';

  const newKey = process.env.APP_ENCRYPTION_KEY;
  const newSalt = process.env.APP_BLIND_INDEX_SALT;

  if (!newKey || !newSalt) {
    console.error(
      '[PII-Rotation] Error: APP_ENCRYPTION_KEY and APP_BLIND_INDEX_SALT must be defined in .env or environment variables.',
    );
    process.exit(1);
  }

  rotatePiiEncryption(targetDbUrl, oldKey, oldSalt, newKey, newSalt).catch(
    (err) => {
      console.error('[PII-Rotation] Error:', err);
      process.exit(1);
    },
  );
}
