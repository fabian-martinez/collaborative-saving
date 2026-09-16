/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

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

async function migrate() {
  const targetDbUrl =
    process.argv[2] ||
    process.env.TARGET_DB_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/restored_db_feb21';

  const isSsl =
    targetDbUrl.includes('neon.tech') ||
    targetDbUrl.includes('sslmode=require') ||
    process.env.DATABASE_SSL === 'true';

  console.log(
    `[PII-Migration] Target DB: ${targetDbUrl.replace(/:[^:@]+@/, ':****@')}`,
  );
  console.log(`[PII-Migration] SSL: ${isSsl ? 'enabled' : 'disabled'}`);

  const client = new Client({
    connectionString: targetDbUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('[PII-Migration] Connected to database.');

  const cryptoService = CryptoService.getInstance();

  try {
    const res = await client.query<MemberRow>(
      `SELECT id, name, email, identification_number, phone, address, beneficiary, email_hash, identification_number_hash 
       FROM public.members ORDER BY id;`,
    );

    console.log(`[PII-Migration] Found ${res.rows.length} members to check.`);

    let updatedCount = 0;
    for (const row of res.rows) {
      let isModified = false;
      let email: string | null | undefined = row.email;
      let emailHash: string | null | undefined = row.email_hash;
      let idNum: string | null | undefined = row.identification_number;
      let idHash: string | null | undefined = row.identification_number_hash;
      let phone: string | null | undefined = row.phone;
      let address: string | null | undefined = row.address;
      let beneficiary: string | null | undefined = row.beneficiary;

      // Handle email
      if (email && !cryptoService.isEncrypted(email)) {
        emailHash = cryptoService.hashBlindIndex(email.toLowerCase().trim());
        email = cryptoService.encrypt(email);
        isModified = true;
      } else if (email && !emailHash) {
        // If already encrypted, decrypt temporarily to compute hash if missing
        const plainEmail = cryptoService.decrypt(email);
        if (plainEmail) {
          emailHash = cryptoService.hashBlindIndex(
            plainEmail.toLowerCase().trim(),
          );
          isModified = true;
        }
      }

      // Handle identification_number
      if (idNum && !cryptoService.isEncrypted(idNum)) {
        idHash = cryptoService.hashBlindIndex(idNum.trim());
        idNum = cryptoService.encrypt(idNum);
        isModified = true;
      } else if (idNum && !idHash) {
        const plainId = cryptoService.decrypt(idNum);
        if (plainId) {
          idHash = cryptoService.hashBlindIndex(plainId.trim());
          isModified = true;
        }
      }

      // Handle phone
      if (phone && !cryptoService.isEncrypted(phone)) {
        phone = cryptoService.encrypt(phone);
        isModified = true;
      }

      // Handle address
      if (address && !cryptoService.isEncrypted(address)) {
        address = cryptoService.encrypt(address);
        isModified = true;
      }

      // Handle beneficiary
      if (beneficiary && !cryptoService.isEncrypted(beneficiary)) {
        beneficiary = cryptoService.encrypt(beneficiary);
        isModified = true;
      }

      if (isModified) {
        await client.query(
          `UPDATE public.members 
           SET email = $1, email_hash = $2, identification_number = $3, identification_number_hash = $4,
               phone = $5, address = $6, beneficiary = $7
           WHERE id = $8;`,
          [
            email,
            emailHash,
            idNum,
            idHash,
            phone,
            address,
            beneficiary,
            row.id,
          ],
        );
        updatedCount++;
        console.log(
          `[PII-Migration] Encrypted & updated member: ${row.id} (${row.name})`,
        );
      }
    }

    console.log(
      `[PII-Migration] Successfully migrated and encrypted ${updatedCount} members.`,
    );

    // Verification
    const verifyRes = await client.query(
      `SELECT count(*) as total,
              count(email_hash) as hashed_emails,
              count(*) filter (where email like 'v1:%') as encrypted_emails
       FROM public.members;`,
    );
    console.log('[PII-Migration] Verification Summary:', verifyRes.rows[0]);
  } finally {
    await client.end();
    console.log('[PII-Migration] Database connection closed.');
  }
}

migrate().catch((err) => {
  console.error('[PII-Migration] Error running migration:', err);
  process.exit(1);
});
