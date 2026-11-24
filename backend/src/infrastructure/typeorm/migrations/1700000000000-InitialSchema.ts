/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Idempotent baseline migration consolidating legacy SQL migrations 0001 through 0006.
 * Safe to run on both fresh databases and existing production databases.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;`,
    );

    // 1. members (includes 0006 blind index columns, without probabilistic ciphertext unique constraints)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.members (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        name text NOT NULL,
        email text,
        identification_number text,
        role text DEFAULT 'member' NOT NULL,
        status text DEFAULT 'active' NOT NULL,
        address text,
        phone text,
        beneficiary text,
        registration_date date DEFAULT current_date NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        deleted_at timestamp with time zone,
        email_hash text,
        identification_number_hash text
      );
    `);

    await queryRunner.query(`
      ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_email_key;
      ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_identification_number_key;
      ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email_hash text;
      ALTER TABLE public.members ADD COLUMN IF NOT EXISTS identification_number_hash text;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_email_hash_key') THEN
          ALTER TABLE public.members ADD CONSTRAINT members_email_hash_key UNIQUE (email_hash);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_identification_number_hash_key') THEN
          ALTER TABLE public.members ADD CONSTRAINT members_identification_number_hash_key UNIQUE (identification_number_hash);
        END IF;
      END $$;
    `);

    // 2. meetings
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.meetings (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        date timestamp with time zone DEFAULT now() NOT NULL,
        status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'closed')),
        notes text
      );
    `);

    // 3. operations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.operations (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
        meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE,
        date timestamp with time zone DEFAULT now() NOT NULL,
        type text NOT NULL,
        description text
      );
    `);

    // 4. stock_types + seed
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.stock_types (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        code text NOT NULL UNIQUE,
        name text NOT NULL,
        behavior text NOT NULL DEFAULT 'CAPITAL_APPRECIATION',
        is_guaranteed boolean DEFAULT false NOT NULL,
        guaranteed_yield numeric(5, 4),
        description text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        deleted_at timestamp with time zone
      );
      CREATE INDEX IF NOT EXISTS idx_stock_types_code ON public.stock_types(code);
      CREATE INDEX IF NOT EXISTS idx_stock_types_deleted_at ON public.stock_types(deleted_at);
    `);

    await queryRunner.query(`
      INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'ordinaria', 'Acción Ordinaria', 'CAPITAL_APPRECIATION', false, null, 'Acción estándar con participación en valorización de activos (Mini, Fénix, Pequeña, Mediana, Grande)', now(), now()),
        (gen_random_uuid(), 'bono_navideno', 'Bono Navideño', 'CAPITAL_APPRECIATION', true, 0.0200, 'Bono navideño con rendimiento pactado garantizado del 2% mensual', now(), now()),
        (gen_random_uuid(), 'cdt', 'Certificado de Depósito a Término', 'CAPITAL_APPRECIATION', true, 0.0150, 'Instrumento de ahorro a plazo fijo con rendimiento garantizado del 1.5% mensual', now(), now()),
        (gen_random_uuid(), 'super', 'Acción Super', 'DIVIDEND_YIELD', false, null, 'Acción especial con distribución periódica directa de rendimientos por dividendo', now(), now()),
        (gen_random_uuid(), 'seguro', 'Seguro', 'CAPITAL_APPRECIATION', false, null, 'Fondo de seguro colectivo mutual', now(), now()),
        (gen_random_uuid(), 'preferencial', 'Acción Preferencial', 'CAPITAL_APPRECIATION', true, 0.0200, 'Acción con rendimiento preferencial garantizado del 2% mensual', now(), now())
      ON CONFLICT (code) DO NOTHING;
    `);

    // 5. stocks + 0005 refactor safety
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.stocks (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        name text NOT NULL UNIQUE,
        value numeric(12, 2) NOT NULL,
        monthly_contribution numeric(12, 2) DEFAULT 0 NOT NULL,
        is_guaranteed boolean DEFAULT false NOT NULL,
        guaranteed_yield numeric(5, 4),
        behavior text NOT NULL DEFAULT 'CAPITAL_APPRECIATION',
        stock_type_id uuid REFERENCES public.stock_types(id) ON DELETE SET NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        deleted_at timestamp with time zone
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'type'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'name'
        ) THEN
          ALTER TABLE public.stocks RENAME COLUMN type TO name;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'created_at'
        ) THEN
          ALTER TABLE public.stocks ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'stock_type_id'
        ) THEN
          ALTER TABLE public.stocks ADD COLUMN stock_type_id uuid REFERENCES public.stock_types(id);
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS idx_stocks_name ON public.stocks(name);
      CREATE INDEX IF NOT EXISTS idx_stocks_created_at ON public.stocks(created_at);
      CREATE INDEX IF NOT EXISTS idx_stocks_stock_type_id ON public.stocks(stock_type_id);
    `);

    // 6. loan_types + seed
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.loan_types (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        code text NOT NULL UNIQUE,
        name text NOT NULL,
        interest_rate numeric(5, 4) NOT NULL,
        description text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        deleted_at timestamp with time zone
      );
      CREATE INDEX IF NOT EXISTS idx_loan_types_code ON public.loan_types(code);
      CREATE INDEX IF NOT EXISTS idx_loan_types_deleted_at ON public.loan_types(deleted_at);
    `);

    await queryRunner.query(`
      INSERT INTO public.loan_types (id, code, name, interest_rate, description, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'corriente', 'Corriente', 0.0150, 'Préstamo corriente estándar con tasa del 1.5% mensual', now(), now()),
        (gen_random_uuid(), 'agil', 'Ágil', 0.0200, 'Préstamo ágil con tasa del 2.0% mensual', now(), now()),
        (gen_random_uuid(), 'prioritario', 'Prioritario', 0.0200, 'Préstamo prioritario para emergencias con tasa del 2.0% mensual', now(), now()),
        (gen_random_uuid(), 'accion', 'Acción', 0.0150, 'Préstamo para financiación de acciones con tasa del 1.5% mensual', now(), now())
      ON CONFLICT (code) DO NOTHING;
    `);

    // 7. loans
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.loans (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
        loan_type text NOT NULL,
        approved_amount numeric(12, 2) NOT NULL,
        disbursed_amount numeric(12, 2) DEFAULT 0 NOT NULL,
        outstanding_balance numeric(12, 2) DEFAULT 0 NOT NULL,
        monthly_payment_amount numeric(12, 2) NOT NULL,
        interest_rate numeric(4, 4) NOT NULL,
        term integer DEFAULT 24 NOT NULL,
        status text DEFAULT 'pending' NOT NULL,
        creation_date date DEFAULT current_date NOT NULL,
        guaranteed_stock_id uuid REFERENCES public.stocks(id) ON DELETE SET NULL
      );
    `);

    // 8. stock_value_history
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.stock_value_history (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        stock_id uuid NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
        operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
        previous_value numeric(12, 2) NOT NULL,
        growth_from_contributions numeric(10, 4) NOT NULL,
        growth_from_interest numeric(10, 4) NOT NULL,
        total_growth_per_share numeric(10, 4) NOT NULL,
        new_value numeric(12, 2) NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 9. stock_subscriptions (0002 purchase_date as timestamptz)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.stock_subscriptions (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
        stock_id uuid NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
        quantity numeric(20, 10) DEFAULT 1 NOT NULL,
        purchase_date timestamp with time zone DEFAULT now() NOT NULL,
        status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
        financing_loan_id uuid NULL REFERENCES public.loans(id) ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'stock_subscriptions'
            AND column_name = 'purchase_date'
            AND data_type = 'date'
        ) THEN
          ALTER TABLE public.stock_subscriptions
            ALTER COLUMN purchase_date TYPE timestamp with time zone;
        END IF;
      END $$;
    `);

    // 10. mandatory_contributions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.mandatory_contributions (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        asset_type text NOT NULL UNIQUE,
        value numeric(12, 2) NOT NULL
      );
    `);

    // 11. loan_transaction_details
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.loan_transaction_details (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
        operation_id uuid REFERENCES public.operations(id) ON DELETE SET NULL,
        transaction_type text NOT NULL CHECK (transaction_type IN ('disbursement', 'principal_payment', 'interest_payment')),
        amount numeric(12, 2) NOT NULL,
        transaction_date date DEFAULT current_date NOT NULL,
        notes text
      );
    `);

    // 12. ledger_entries + 0002 indexes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.ledger_entries (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
        account_type text NOT NULL,
        amount numeric(12, 2) NOT NULL,
        description text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,
        stock_id uuid REFERENCES public.stocks(id) ON DELETE SET NULL,
        mandatory_contribution_id uuid REFERENCES public.mandatory_contributions(id) ON DELETE SET NULL,
        stock_subscription_id uuid REFERENCES public.stock_subscriptions(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_type ON public.ledger_entries(account_type);
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON public.ledger_entries(created_at);
    `);

    // 13. Custom type member_due
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'member_due' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE public.member_due AS (
            type text,
            description text,
            amount numeric
          );
        END IF;
      END $$;
    `);

    // 14. pending_member_payments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.pending_member_payments (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
        meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
        type text NOT NULL CHECK (type IN ('dividend', 'stock_withdrawal', 'loan', 'other')),
        amount numeric(12, 2) NOT NULL,
        status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
        notes text,
        stock_id uuid REFERENCES public.stocks(id) ON DELETE SET NULL,
        loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,
        stock_subscription_id uuid REFERENCES public.stock_subscriptions(id) ON DELETE SET NULL,
        reference_meeting_id uuid REFERENCES public.meetings(id) ON DELETE SET NULL,
        disbursement_type text,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
  }

  public async down(): Promise<void> {
    // Baseline migration: intentionally non-destructive on down() to protect production data.
  }
}
