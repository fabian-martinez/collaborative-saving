-- =================================================================
--  MIGRATION SCRIPT: Restores Stocks Table
-- =================================================================
--  Propósito: This script some attributes deleted in previous migration
-- =================================================================

-- Step 1: Add the missing columns to the `stocks` table.
ALTER TABLE public.stocks
ADD COLUMN IF NOT EXISTS value NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS monthly_contribution NUMERIC(12, 2) DEFAULT 0;

-- Step 2: Move the data from `stocks_types` to `stocks`.
UPDATE public.stocks s
SET
    value = st.value,
    monthly_contribution = st.monthly_contribution,
    name = st.name
FROM public.stock_types st
WHERE st.id = s.stock_type_id;

-- Step 3: Drop value and monthly_contribution from stock_types table
ALTER TABLE public.stock_types
DROP COLUMN IF EXISTS value,
DROP COLUMN IF EXISTS monthly_contribution;

