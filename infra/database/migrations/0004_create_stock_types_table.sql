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

-- 3. Sembrado inicial teniendo en cuenta los tipos de datos de producción (Docker)
INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'acciones_grandes', 'Acciones Grandes', 'CAPITAL_APPRECIATION', false, null, 'Acción de alta denominación con apreciación de capital', now(), now()),
    (gen_random_uuid(), 'acciones_medianas', 'Acciones Medianas', 'CAPITAL_APPRECIATION', false, null, 'Acción de mediana denominación', now(), now()),
    (gen_random_uuid(), 'acciones_pequenas', 'Acciones Pequeñas', 'CAPITAL_APPRECIATION', false, null, 'Acción de baja denominación', now(), now()),
    (gen_random_uuid(), 'acciones_super', 'Acciones Super', 'DIVIDEND_YIELD', false, null, 'Acción especial con distribución periódica directa de rendimientos por dividendo', now(), now()),
    (gen_random_uuid(), 'bono_navideno', 'Bono Navideño', 'CAPITAL_APPRECIATION', true, 0.0200, 'Bono navideño con rendimiento pactado garantizado del 2% mensual', now(), now()),
    (gen_random_uuid(), 'bono_navideno_2026', 'Bono Navideño 2026', 'CAPITAL_APPRECIATION', true, 0.0200, 'Bono navideño emisión 2026 con rendimiento pactado garantizado del 2% mensual', now(), now()),
    (gen_random_uuid(), 'cdt', 'Certificado de Depósito a Término', 'CAPITAL_APPRECIATION', true, 0.0150, 'Instrumento de ahorro a plazo fijo con rendimiento garantizado del 1.5% mensual', now(), now()),
    (gen_random_uuid(), 'accion_fenix', 'Accion Fenix', 'CAPITAL_APPRECIATION', false, null, 'Acción Serie Fénix', now(), now()),
    (gen_random_uuid(), 'accion_mini', 'Accion Mini', 'CAPITAL_APPRECIATION', false, null, 'Acción de denominación reducida', now(), now()),
    (gen_random_uuid(), 'seguro', 'Seguro', 'CAPITAL_APPRECIATION', false, null, 'Fondo de seguro colectivo mutual', now(), now()),
    (gen_random_uuid(), 'ordinaria', 'Acción Ordinaria', 'CAPITAL_APPRECIATION', false, null, 'Acción estándar con participación en valorización de activos', now(), now()),
    (gen_random_uuid(), 'preferencial', 'Acción Preferencial', 'CAPITAL_APPRECIATION', true, 0.0200, 'Acción con rendimiento preferencial garantizado del 2% mensual', now(), now())
ON CONFLICT (code) DO NOTHING;

-- 4. Extracción e inserción dinámica de tipos desde la tabla stocks si contiene otros tipos no mapeados
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stocks') THEN
        INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            s.derived_code,
            s.derived_name,
            s.behavior,
            s.is_guaranteed,
            s.guaranteed_yield,
            'Tipo de acción migrado automáticamente desde stocks de producción',
            now(),
            now()
        FROM (
            SELECT DISTINCT ON (derived_code)
                CASE 
                    WHEN type ILIKE 'CDT%' THEN 'cdt'
                    ELSE LOWER(REGEXP_REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(type), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), '[^a-zA-Z0-9]+', '_', 'g'))
                END AS derived_code,
                CASE 
                    WHEN type ILIKE 'CDT%' THEN 'Certificado de Depósito a Término'
                    ELSE type
                END AS derived_name,
                behavior,
                is_guaranteed,
                guaranteed_yield
            FROM public.stocks
            ORDER BY derived_code, id
        ) s
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

-- 5. Vincular relación stock_type_id en la tabla stocks si existe (compatibilidad con datos de producción)
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
        UPDATE public.stocks s
        SET stock_type_id = st.id
        FROM public.stock_types st
        WHERE s.stock_type_id IS NULL
          AND (
            (s.type ILIKE 'CDT%' AND st.code = 'cdt')
            OR (LOWER(s.type) = 'bono navideño' AND st.code = 'bono_navideno')
            OR (LOWER(s.type) = 'bono navideño 2026' AND st.code = 'bono_navideno_2026')
            OR (LOWER(s.type) = 'acciones grandes' AND st.code = 'acciones_grandes')
            OR (LOWER(s.type) = 'acciones medianas' AND st.code = 'acciones_medianas')
            OR (LOWER(s.type) = 'acciones pequeñas' AND st.code = 'acciones_pequenas')
            OR (LOWER(s.type) = 'acciones super' AND st.code = 'acciones_super')
            OR (LOWER(s.type) = 'accion fenix' AND st.code = 'accion_fenix')
            OR (LOWER(s.type) = 'accion mini' AND st.code = 'accion_mini')
            OR (LOWER(s.type) = 'seguro' AND st.code = 'seguro')
            OR (LOWER(TRIM(s.type)) = LOWER(TRIM(st.name)))
          );
    END IF;
END $$;
