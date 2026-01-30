-- =================================================================
-- ▤ 0002: Generalized Loan and Stock Relationship
-- Introduces LoanType, StockType, and InterestDistributionConfig.
-- Migrates existing data to the new structure.
-- =================================================================

-- 1. Create StockType table
CREATE TABLE public.stock_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    behavior text NOT NULL DEFAULT 'CAPITAL_APPRECIATION'
);
COMMENT ON TABLE public.stock_types IS 'Defines categories and behaviors of stocks.';

-- 2. Create LoanType table
CREATE TABLE public.loan_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    default_approved_amount numeric(12, 2) NOT NULL,
    default_interest_rate numeric(5, 4) NOT NULL,
    default_term integer NOT NULL,
    amortization_type text NOT NULL DEFAULT 'french'
);
COMMENT ON TABLE public.loan_types IS 'Defines configurations for different types of loans.';

-- 3. Create InterestDistributionConfig table
CREATE TABLE public.interest_distribution_configs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    loan_type_id uuid NOT NULL REFERENCES public.loan_types(id) ON DELETE CASCADE,
    stock_type_id uuid NOT NULL REFERENCES public.stock_types(id) ON DELETE CASCADE,
    UNIQUE(loan_type_id, stock_type_id)
);
COMMENT ON TABLE public.interest_distribution_configs IS 'Mappings for interest distribution from loans to stocks.';

-- 4. Add columns to stocks and loans
ALTER TABLE public.stocks ADD COLUMN stock_type_id uuid REFERENCES public.stock_types(id);
ALTER TABLE public.loans ADD COLUMN loan_type_id uuid REFERENCES public.loan_types(id);

-- 5. Seed initial types and mapping (Legacy data migration)

-- Seed StockTypes from existing stock types
INSERT INTO public.stock_types (name, behavior)
SELECT DISTINCT type, behavior FROM public.stocks;

-- Seed LoanTypes with default values (approximated from current usage)
INSERT INTO public.loan_types (name, default_approved_amount, default_interest_rate, default_term, amortization_type)
VALUES 
('corriente', 1000000.00, 0.0100, 24, 'french'),
('agil', 500000.00, 0.0200, 12, 'french'),
('prioritario', 2000000.00, 0.0150, 24, 'french'),
('accion', 1000000.00, 0.0100, 24, 'french');

-- Map 'agil' and 'prioritario' to 'Bono Navideño' (or whatever stock exists)
-- This part assumes there's a stock named 'Bono' or similar
DO $$
DECLARE
    agil_id uuid;
    prioritario_id uuid;
    bono_id uuid;
BEGIN
    SELECT id INTO agil_id FROM public.loan_types WHERE name = 'agil';
    SELECT id INTO prioritario_id FROM public.loan_types WHERE name = 'prioritario';
    SELECT id INTO bono_id FROM public.stock_types WHERE name ILIKE '%Bono%';
    
    IF agil_id IS NOT NULL AND bono_id IS NOT NULL THEN
        INSERT INTO public.interest_distribution_configs (loan_type_id, stock_type_id) 
        VALUES (agil_id, bono_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF prioritario_id IS NOT NULL AND bono_id IS NOT NULL THEN
        INSERT INTO public.interest_distribution_configs (loan_type_id, stock_type_id) 
        VALUES (prioritario_id, bono_id) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 6. Link existing records
UPDATE public.stocks s SET stock_type_id = st.id FROM public.stock_types st WHERE s.type = st.name;
UPDATE public.loans l SET loan_type_id = lt.id FROM public.loan_types lt WHERE l.loan_type = lt.name;
