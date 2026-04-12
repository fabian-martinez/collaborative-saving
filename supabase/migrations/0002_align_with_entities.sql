-- =================================================================
-- ▤ 0002: Align Database with TypeORM Entities
-- This script fixes discrepancies found between the DB and code.
-- =================================================================

-- 1. Fix stock_subscriptions.purchase_date type
-- Moving from DATE to TIMESTAMPTZ as expected by the entity.
ALTER TABLE public.stock_subscriptions 
ALTER COLUMN purchase_date TYPE timestamp with time zone;

-- 2. Add missing indexes for LedgerEntry
-- These optimize financial aggregations and reports.
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_type ON public.ledger_entries(account_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON public.ledger_entries(created_at);
