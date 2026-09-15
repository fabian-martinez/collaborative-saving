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
COMMENT ON COLUMN public.stock_types.code IS 'Identificador único/slug del tipo de acción (ej. acciones_grandes, bono_navideno, cdt)';
COMMENT ON COLUMN public.stock_types.behavior IS 'Comportamiento financiero: CAPITAL_APPRECIATION o DIVIDEND_YIELD';
COMMENT ON COLUMN public.stock_types.is_guaranteed IS 'Indica si el tipo de acción ofrece un rendimiento pactado garantizado';
COMMENT ON COLUMN public.stock_types.guaranteed_yield IS 'Tasa o porcentaje de rendimiento garantizado (ej. 0.0200 para 2%)';

-- 2. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_stock_types_code ON public.stock_types(code);
CREATE INDEX IF NOT EXISTS idx_stock_types_deleted_at ON public.stock_types(deleted_at);

-- 3. Sembrado inicial de tipos de acciones base
INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ordinaria', 'Acción Ordinaria', 'CAPITAL_APPRECIATION', false, null, 'Acción estándar con participación en valorización de activos (Mini, Fénix, Pequeña, Mediana, Grande)', now(), now()),
    (gen_random_uuid(), 'bono_navideno', 'Bono Navideño', 'CAPITAL_APPRECIATION', true, 0.0200, 'Bono navideño con rendimiento pactado garantizado del 2% mensual', now(), now()),
    (gen_random_uuid(), 'cdt', 'Certificado de Depósito a Término', 'CAPITAL_APPRECIATION', true, 0.0150, 'Instrumento de ahorro a plazo fijo con rendimiento garantizado del 1.5% mensual', now(), now()),
    (gen_random_uuid(), 'super', 'Acción Super', 'DIVIDEND_YIELD', false, null, 'Acción especial con distribución periódica directa de rendimientos por dividendo', now(), now()),
    (gen_random_uuid(), 'seguro', 'Seguro', 'CAPITAL_APPRECIATION', false, null, 'Fondo de seguro colectivo mutual', now(), now()),
    (gen_random_uuid(), 'preferencial', 'Acción Preferencial', 'CAPITAL_APPRECIATION', true, 0.0200, 'Acción con rendimiento preferencial garantizado del 2% mensual', now(), now())
ON CONFLICT (code) DO NOTHING;

-- 4. Vincular relación stock_type_id en la tabla stocks si existe (compatibilidad con datos de producción)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stocks') THEN
        -- Agregar columna stock_type_id a stocks si aún no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'stock_type_id'
        ) THEN
            ALTER TABLE public.stocks ADD COLUMN stock_type_id uuid REFERENCES public.stock_types(id);
            CREATE INDEX idx_stocks_stock_type_id ON public.stocks(stock_type_id);
        END IF;

        -- Actualizar los stocks de producción con su stock_type_id correspondiente
        -- Soporta tanto columna 'name' como 'type'
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'name') THEN
            UPDATE public.stocks s
            SET stock_type_id = st.id
            FROM public.stock_types st
            WHERE s.stock_type_id IS NULL
              AND (
                (s.name ILIKE 'CDT%' AND st.code = 'cdt')
                OR (LOWER(s.name) IN ('bono navideño', 'bono navideño 2026') AND st.code = 'bono_navideno')
                OR (LOWER(s.name) IN ('accion mini', 'accion fenix', 'acciones pequeñas', 'acciones medianas', 'acciones grandes') AND st.code = 'ordinaria')
                OR (LOWER(s.name) IN ('acciones super', 'accion super', 'super') AND st.code = 'super')
                OR (LOWER(s.name) = 'seguro' AND st.code = 'seguro')
                OR (LOWER(TRIM(s.name)) = LOWER(TRIM(st.name)))
              );
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'type') THEN
            UPDATE public.stocks s
            SET stock_type_id = st.id
            FROM public.stock_types st
            WHERE s.stock_type_id IS NULL
              AND (
                (s.type ILIKE 'CDT%' AND st.code = 'cdt')
                OR (LOWER(s.type) IN ('bono navideño', 'bono navideño 2026') AND st.code = 'bono_navideno')
                OR (LOWER(s.type) IN ('accion mini', 'accion fenix', 'acciones pequeñas', 'acciones medianas', 'acciones grandes') AND st.code = 'ordinaria')
                OR (LOWER(s.type) IN ('acciones super', 'accion super', 'super') AND st.code = 'super')
                OR (LOWER(s.type) = 'seguro' AND st.code = 'seguro')
                OR (LOWER(TRIM(s.type)) = LOWER(TRIM(st.name)))
              );
        END IF;
    END IF;
END $$;
