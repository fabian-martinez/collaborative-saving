-- ==============================================================================
-- reorganizar_relacion_acciones_tipos.sql
-- Organiza la relación entre acciones (stocks) y tipos de acciones (stock_types).
-- Tipos base: ordinaria, bono_navideno, cdt, super (y seguro)
-- Instancias:
--   - Bono navideño y Bono navideño 2026 -> bono_navideno
--   - Mini, Fénix, Grande, Mediana, Pequeña -> ordinaria
--   - CDTs -> cdt
--   - Super -> super
-- ==============================================================================

BEGIN;

-- 1. Renombrar o asegurar existencia del tipo 'super'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.stock_types WHERE code = 'acciones_super') AND NOT EXISTS (SELECT 1 FROM public.stock_types WHERE code = 'super') THEN
        UPDATE public.stock_types
        SET code = 'super', name = 'Acción Super'
        WHERE code = 'acciones_super';
    ELSE
        INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description, created_at, updated_at)
        VALUES (gen_random_uuid(), 'super', 'Acción Super', 'DIVIDEND_YIELD', false, null, 'Acción especial con distribución periódica directa de rendimientos por dividendo', now(), now())
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

-- 2. Asegurar existencia de los tipos base restantes
INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ordinaria', 'Acción Ordinaria', 'CAPITAL_APPRECIATION', false, null, 'Acción estándar con participación en valorización de activos', now(), now()),
    (gen_random_uuid(), 'bono_navideno', 'Bono Navideño', 'CAPITAL_APPRECIATION', true, 0.0200, 'Bono navideño con rendimiento pactado garantizado del 2% mensual', now(), now()),
    (gen_random_uuid(), 'cdt', 'Certificado de Depósito a Término', 'CAPITAL_APPRECIATION', true, 0.0150, 'Instrumento de ahorro a plazo fijo con rendimiento garantizado del 1.5% mensual', now(), now())
ON CONFLICT (code) DO NOTHING;

-- 3. Reasignar stock_type_id en stocks a los tipos base correctos
-- 3.1 Tipo Ordinaria (mini, fenix, grande, mediana, pequeña)
UPDATE public.stocks
SET stock_type_id = (SELECT id FROM public.stock_types WHERE code = 'ordinaria')
WHERE name IN (
    'Accion Mini',
    'Accion Fenix',
    'Acciones Grandes',
    'Acciones Medianas',
    'Acciones Pequeñas'
);

-- 3.2 Tipo Bono Navideño (Bono Navideño, Bono Navideño 2026)
UPDATE public.stocks
SET stock_type_id = (SELECT id FROM public.stock_types WHERE code = 'bono_navideno')
WHERE name IN (
    'Bono Navideño',
    'Bono Navideño 2026'
);

-- 3.3 Tipo Super (Acciones Super)
UPDATE public.stocks
SET stock_type_id = (SELECT id FROM public.stock_types WHERE code = 'super')
WHERE name = 'Acciones Super';

-- 3.4 Tipo CDT
UPDATE public.stocks
SET stock_type_id = (SELECT id FROM public.stock_types WHERE code = 'cdt')
WHERE name ILIKE 'CDT%';

-- 4. Eliminar tipos obsoletos y duplicados en stock_types que ya no tienen stocks asociados
DELETE FROM public.stock_types
WHERE code IN (
    'accion_fenix',
    'accion_mini',
    'acciones_grandes',
    'acciones_medianas',
    'acciones_pequenas',
    'acciones_peque_as',
    'bono_navide_o',
    'bono_navide_o_2026',
    'bono_navideno_2026',
    'acciones_super'
);

COMMIT;
