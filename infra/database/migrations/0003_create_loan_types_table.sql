-- =================================================================
-- ▤ 0003: Create loan_types Table and Initial Seed Data
-- =================================================================

-- 1. Crear tabla loan_types
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

COMMENT ON TABLE public.loan_types IS 'Define los tipos de préstamo disponibles en el fondo y sus tasas por defecto.';
COMMENT ON COLUMN public.loan_types.code IS 'Identificador único/slug del tipo de préstamo (ej. corriente, agil, etc.)';
COMMENT ON COLUMN public.loan_types.interest_rate IS 'Tasa de interés mensual decimal (ej. 0.0150 para 1.5%)';

-- 2. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_loan_types_code ON public.loan_types(code);
CREATE INDEX IF NOT EXISTS idx_loan_types_deleted_at ON public.loan_types(deleted_at);

-- 3. Sembrado inicial de datos (compatibilidad con préstamos existentes)
INSERT INTO public.loan_types (id, code, name, interest_rate, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'corriente', 'Corriente', 0.0150, 'Préstamo corriente estándar con tasa del 1.5% mensual', now(), now()),
    (gen_random_uuid(), 'agil', 'Ágil', 0.0200, 'Préstamo ágil con tasa del 2.0% mensual', now(), now()),
    (gen_random_uuid(), 'prioritario', 'Prioritario', 0.0200, 'Préstamo prioritario para emergencias con tasa del 2.0% mensual', now(), now()),
    (gen_random_uuid(), 'accion', 'Acción', 0.0150, 'Préstamo para financiación de acciones con tasa del 1.5% mensual', now(), now())
ON CONFLICT (code) DO NOTHING;
