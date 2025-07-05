-- =================================================================
-- ▤ 0005: Add outstanding_balance to loans table
-- =================================================================
-- This migration adds the outstanding_balance column to the loans
-- table to track the remaining balance of a loan separately
-- from the approved amount. It also sets a default value for
-- existing rows to be the same as the approved_amount.
-- =================================================================

ALTER TABLE public.loans
ADD COLUMN outstanding_balance numeric(10, 2) NOT NULL DEFAULT 0;

UPDATE public.loans
SET outstanding_balance = approved_amount;

ALTER TABLE public.loans
ALTER COLUMN outstanding_balance DROP DEFAULT; 