
-- =================================================================
--  MIGRATION SCRIPT: Refactor and Cleanup Stocks Table
-- =================================================================
--  Propósito: This script removes redundant columns from the `stocks`
--             table and moves the data to the `stock_types` table.
-- =================================================================

-- Step 1: Populate the `stock_type_id` in the `stocks` table by matching `stocks.type` with `stock_types.name`.
UPDATE public.stocks s
SET stock_type_id = st.id
FROM public.stock_types st
WHERE s.type = st.name;

-- Step 2: Add the missing columns to the `stock_types` table.
ALTER TABLE public.stock_types
ADD COLUMN IF NOT EXISTS value NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS monthly_contribution NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_guaranteed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guaranteed_yield NUMERIC(5, 4);

-- Step 3: Move the data from `stocks` to `stock_types`.
UPDATE public.stock_types st
SET
    value = s.value,
    monthly_contribution = s.monthly_contribution,
    is_guaranteed = s.is_guaranteed,
    guaranteed_yield = s.guaranteed_yield
FROM public.stocks s
WHERE st.id = s.stock_type_id;

-- Make the `stock_type_id` in `stocks` NOT NULL before dropping the `type` column.
ALTER TABLE public.stocks
ALTER COLUMN stock_type_id SET NOT NULL;

-- Step 4: Drop the redundant columns from the `stocks` table.
ALTER TABLE public.stocks
DROP COLUMN IF EXISTS type,
DROP COLUMN IF EXISTS value,
DROP COLUMN IF EXISTS monthly_contribution,
DROP COLUMN IF EXISTS is_guaranteed,
DROP COLUMN IF EXISTS guaranteed_yield,
DROP COLUMN IF EXISTS behavior;

SELECT 'Migration to cleanup stocks table completed successfully!';
