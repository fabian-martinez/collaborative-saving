-- =================================================================
-- ▤ 0006: Encrypt PII Fields and Add Blind Indexes (Issue #225)
-- Enables Application-Level Encryption (FLE) on public.members.
-- Drops unique constraints on probabilistic ciphertext columns (email,
-- identification_number) and adds unique deterministic blind indexes.
-- =================================================================

-- 1. Drop existing unique constraints on columns that will store AES-256-GCM ciphertexts
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_email_key;
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_identification_number_key;

-- 2. Add blind index hash columns for fast lookups and unique enforcement
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email_hash text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS identification_number_hash text;

-- 3. Add UNIQUE constraints on blind index columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'members_email_hash_key'
    ) THEN
        ALTER TABLE public.members ADD CONSTRAINT members_email_hash_key UNIQUE (email_hash);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'members_identification_number_hash_key'
    ) THEN
        ALTER TABLE public.members ADD CONSTRAINT members_identification_number_hash_key UNIQUE (identification_number_hash);
    END IF;
END $$;

-- 4. Comments for documentation and DBA clarity
COMMENT ON COLUMN public.members.email IS 'AES-256-GCM encrypted email address (v1:iv:tag:ciphertext).';
COMMENT ON COLUMN public.members.identification_number IS 'AES-256-GCM encrypted identification number (v1:iv:tag:ciphertext).';
COMMENT ON COLUMN public.members.phone IS 'AES-256-GCM encrypted phone number (v1:iv:tag:ciphertext).';
COMMENT ON COLUMN public.members.address IS 'AES-256-GCM encrypted physical address (v1:iv:tag:ciphertext).';
COMMENT ON COLUMN public.members.beneficiary IS 'AES-256-GCM encrypted beneficiary name (v1:iv:tag:ciphertext).';
COMMENT ON COLUMN public.members.email_hash IS 'Deterministic HMAC-SHA256 blind index for unique constraints and exact match queries.';
COMMENT ON COLUMN public.members.identification_number_hash IS 'Deterministic HMAC-SHA256 blind index for unique constraints and exact match queries.';
