-- =================================================================
-- ▤ 0004: Create stock_types Table and Initial Seed Data
-- =================================================================

-- 1. Crear tabla stock_types
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

COMMENT ON TABLE public.stock_types IS 'Define los tipos y comportamiento de las acciones disponibles en el fondo.';
COMMENT ON COLUMN public.stock_types.code IS 'Identificador único/slug del tipo de acción (ej. ordinaria, preferencial, cdt)';
COMMENT ON COLUMN public.stock_types.behavior IS 'Comportamiento financiero: CAPITAL_APPRECIATION o DIVIDEND_YIELD';
COMMENT ON COLUMN public.stock_types.is_guaranteed IS 'Indica si el tipo de acción ofrece un rendimiento pactado garantizado';
COMMENT ON COLUMN public.stock_types.guaranteed_yield IS 'Tasa o porcentaje de rendimiento garantizado (ej. 0.0200 para 2%)';

-- 2. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_stock_types_code ON public.stock_types(code);
CREATE INDEX IF NOT EXISTS idx_stock_types_deleted_at ON public.stock_types(deleted_at);

-- 3. Sembrado inicial de datos (compatibilidad con acciones existentes)
INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ordinaria', 'Acción Ordinaria', 'CAPITAL_APPRECIATION', false, null, 'Acción estándar con participación en valorización de activos', now(), now()),
    (gen_random_uuid(), 'preferencial', 'Acción Preferencial', 'CAPITAL_APPRECIATION', true, 0.0200, 'Acción con rendimiento preferencial garantizado del 2% mensual', now(), now()),
    (gen_random_uuid(), 'grande', 'Acción Grande', 'CAPITAL_APPRECIATION', false, null, 'Acción de alta denominación con apreciación de capital', now(), now()),
    (gen_random_uuid(), 'mediana', 'Acción Mediana', 'CAPITAL_APPRECIATION', false, null, 'Acción de mediana denominación', now(), now()),
    (gen_random_uuid(), 'pequena', 'Acción Pequeña', 'CAPITAL_APPRECIATION', false, null, 'Acción de baja denominación', now(), now()),
    (gen_random_uuid(), 'cdt', 'Certificado de Depósito a Término', 'DIVIDEND_YIELD', true, 0.0200, 'Instrumento de ahorro a plazo fijo con rendimiento garantizado', now(), now())
ON CONFLICT (code) DO NOTHING;
