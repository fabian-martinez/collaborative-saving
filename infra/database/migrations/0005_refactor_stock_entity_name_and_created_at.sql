-- =================================================================
-- ▤ 0005: Refactor Stock Entity (type -> name, created_at)
-- =================================================================

-- 1. Renombrar columna 'type' a 'name' en la tabla stocks si aún no se ha renombrado
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
END $$;

-- 2. Asegurar que exista la columna created_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.stocks ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
    END IF;
END $$;

-- 3. Índices de optimización para name y created_at
CREATE INDEX IF NOT EXISTS idx_stocks_name ON public.stocks(name);
CREATE INDEX IF NOT EXISTS idx_stocks_created_at ON public.stocks(created_at);

COMMENT ON COLUMN public.stocks.name IS 'Nombre descriptivo o identificador de la acción (anteriormente type).';
COMMENT ON COLUMN public.stocks.created_at IS 'Fecha y hora de creación del registro de acción.';
