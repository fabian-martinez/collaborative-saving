-- Análisis completo del desbalance de Bonos Navideños
-- Este script analiza por qué CASH + préstamos pendientes < Valor total Bonos Navideños
-- 
-- Autor: Generado automáticamente
-- Fecha: 2025-11-18

-- ============================================================================
-- ANÁLISIS 1: Recursos disponibles vs Valor total de Bonos Navideños
-- ============================================================================
WITH recursos_disponibles AS (
    SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM ledger_entries WHERE account_type = 'CASH') as cash,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM loans WHERE loan_type = 'agil') as prestamos_agiles_pendientes,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM loans WHERE loan_type = 'prioritario') as prestamos_prioritarios_pendientes
),
valor_bonos AS (
    SELECT 
        s.value * COALESCE(SUM(ss.quantity), 0) as valor_total,
        COUNT(DISTINCT ss.member_id) as miembros_con_bonos,
        SUM(ss.quantity) as total_unidades
    FROM stocks s
    LEFT JOIN stock_subscriptions ss ON s.id = ss.stock_id AND ss.status = 'active'
    WHERE s.type = 'Bono Navideño'
    GROUP BY s.value
)
SELECT 
    '=== ANÁLISIS 1: RECURSOS VS VALOR TOTAL BONOS ===' as titulo,
    rd.cash as cash_disponible,
    rd.prestamos_agiles_pendientes as agiles_pendientes,
    rd.prestamos_prioritarios_pendientes as prioritarios_pendientes,
    (rd.cash + rd.prestamos_agiles_pendientes + rd.prestamos_prioritarios_pendientes) as total_recursos,
    vb.valor_total as valor_total_bonos,
    vb.total_unidades as unidades_totales_bonos,
    vb.miembros_con_bonos as miembros_con_bonos,
    (rd.cash + rd.prestamos_agiles_pendientes + rd.prestamos_prioritarios_pendientes) - vb.valor_total as diferencia,
    CASE 
        WHEN (rd.cash + rd.prestamos_agiles_pendientes + rd.prestamos_prioritarios_pendientes) > vb.valor_total 
        THEN 'SÍ ✓' 
        ELSE 'NO ✗ - HAY DÉFICIT' 
    END as cumple_condicion
FROM recursos_disponibles rd
CROSS JOIN valor_bonos vb;

-- ============================================================================
-- ANÁLISIS 2: Bonos Navideños usados como garantía
-- ============================================================================
WITH bonos_como_garantia AS (
    SELECT 
        l.loan_type,
        COUNT(DISTINCT l.id) as cantidad_prestamos,
        SUM(l.approved_amount) as monto_aprobado_total,
        SUM(l.outstanding_balance) as saldo_pendiente_total,
        SUM(ss.quantity) as unidades_garantizadas,
        s.value as valor_unitario,
        s.value * SUM(ss.quantity) as valor_total_garantizado
    FROM loans l
    INNER JOIN stocks s ON l.guaranteed_stock_id = s.id
    LEFT JOIN stock_subscriptions ss ON ss.member_id = l.member_id AND ss.stock_id = s.id AND ss.status = 'active'
    WHERE l.loan_type IN ('agil', 'prioritario')
    AND s.type = 'Bono Navideño'
    GROUP BY l.loan_type, s.value
),
total_garantizado AS (
    SELECT 
        SUM(valor_total_garantizado) as total_valor_garantizado,
        SUM(unidades_garantizadas) as total_unidades_garantizadas
    FROM bonos_como_garantia
)
SELECT 
    '=== ANÁLISIS 2: BONOS USADOS COMO GARANTÍA ===' as titulo,
    bcg.loan_type as tipo_prestamo,
    bcg.cantidad_prestamos,
    bcg.monto_aprobado_total,
    bcg.saldo_pendiente_total,
    bcg.unidades_garantizadas,
    bcg.valor_total_garantizado
FROM bonos_como_garantia bcg
UNION ALL
SELECT 
    'TOTAL GARANTIZADO',
    NULL,
    NULL,
    NULL,
    NULL,
    tg.total_unidades_garantizadas,
    tg.total_valor_garantizado
FROM total_garantizado tg;

-- ============================================================================
-- ANÁLISIS 3: Bonos disponibles vs comprometidos
-- ============================================================================
WITH valor_bonos_total AS (
    SELECT 
        s.value * COALESCE(SUM(ss.quantity), 0) as valor_total,
        SUM(ss.quantity) as total_unidades
    FROM stocks s
    LEFT JOIN stock_subscriptions ss ON s.id = ss.stock_id AND ss.status = 'active'
    WHERE s.type = 'Bono Navideño'
    GROUP BY s.value
),
bonos_garantizados AS (
    SELECT 
        s.value * COALESCE(SUM(ss.quantity), 0) as valor_garantizado,
        SUM(ss.quantity) as unidades_garantizadas
    FROM loans l
    INNER JOIN stocks s ON l.guaranteed_stock_id = s.id
    LEFT JOIN stock_subscriptions ss ON ss.member_id = l.member_id AND ss.stock_id = s.id AND ss.status = 'active'
    WHERE l.loan_type IN ('agil', 'prioritario')
    AND s.type = 'Bono Navideño'
    GROUP BY s.value
)
SELECT 
    '=== ANÁLISIS 3: BONOS DISPONIBLES VS COMPROMETIDOS ===' as titulo,
    vbt.valor_total as valor_total_bonos,
    vbt.total_unidades as unidades_totales,
    COALESCE(bg.valor_garantizado, 0) as valor_garantizado,
    COALESCE(bg.unidades_garantizadas, 0) as unidades_garantizadas,
    (vbt.valor_total - COALESCE(bg.valor_garantizado, 0)) as valor_disponible,
    (vbt.total_unidades - COALESCE(bg.unidades_garantizadas, 0)) as unidades_disponibles,
    ROUND((COALESCE(bg.valor_garantizado, 0) / vbt.valor_total * 100)::numeric, 2) as porcentaje_comprometido
FROM valor_bonos_total vbt
LEFT JOIN bonos_garantizados bg ON TRUE;

-- ============================================================================
-- ANÁLISIS 4: Condición ajustada (considerando garantías)
-- ============================================================================
WITH recursos_disponibles AS (
    SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM ledger_entries WHERE account_type = 'CASH') as cash,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM loans WHERE loan_type = 'agil') as prestamos_agiles_pendientes,
        (SELECT COALESCE(SUM(outstanding_balance), 0) FROM loans WHERE loan_type = 'prioritario') as prestamos_prioritarios_pendientes
),
valor_bonos AS (
    SELECT 
        s.value * COALESCE(SUM(ss.quantity), 0) as valor_total
    FROM stocks s
    LEFT JOIN stock_subscriptions ss ON s.id = ss.stock_id AND ss.status = 'active'
    WHERE s.type = 'Bono Navideño'
    GROUP BY s.value
),
bonos_como_garantia AS (
    SELECT 
        s.value * COALESCE(SUM(ss.quantity), 0) as valor_garantizado
    FROM loans l
    INNER JOIN stocks s ON l.guaranteed_stock_id = s.id
    LEFT JOIN stock_subscriptions ss ON ss.member_id = l.member_id AND ss.stock_id = s.id AND ss.status = 'active'
    WHERE l.loan_type IN ('agil', 'prioritario')
    AND s.type = 'Bono Navideño'
    GROUP BY s.value
)
SELECT 
    '=== ANÁLISIS 4: CONDICIÓN AJUSTADA (CONSIDERANDO GARANTÍAS) ===' as titulo,
    rd.cash as cash_disponible,
    rd.prestamos_agiles_pendientes as agiles_pendientes,
    rd.prestamos_prioritarios_pendientes as prioritarios_pendientes,
    (rd.cash + rd.prestamos_agiles_pendientes + rd.prestamos_prioritarios_pendientes) as total_recursos,
    vb.valor_total as valor_total_bonos,
    COALESCE(bcg.valor_garantizado, 0) as bonos_como_garantia,
    (vb.valor_total - COALESCE(bcg.valor_garantizado, 0)) as bonos_disponibles,
    (rd.cash + rd.prestamos_agiles_pendientes + rd.prestamos_prioritarios_pendientes) - (vb.valor_total - COALESCE(bcg.valor_garantizado, 0)) as diferencia_ajustada,
    CASE 
        WHEN (rd.cash + rd.prestamos_agiles_pendientes + rd.prestamos_prioritarios_pendientes) > (vb.valor_total - COALESCE(bcg.valor_garantizado, 0))
        THEN 'SÍ ✓ - CONDICIÓN CUMPLIDA' 
        ELSE 'NO ✗ - AÚN HAY DÉFICIT' 
    END as cumple_condicion_ajustada
FROM recursos_disponibles rd
CROSS JOIN valor_bonos vb
LEFT JOIN bonos_como_garantia bcg ON TRUE;

-- ============================================================================
-- ANÁLISIS 5: Detalle de préstamos con garantía de Bono Navideño
-- ============================================================================
SELECT 
    '=== ANÁLISIS 5: DETALLE PRÉSTAMOS CON GARANTÍA BONO NAVIDEÑO ===' as titulo,
    l.loan_type as tipo_prestamo,
    m.name as miembro,
    l.approved_amount as monto_aprobado,
    l.disbursed_amount as monto_desembolsado,
    l.outstanding_balance as saldo_pendiente,
    ss.quantity as unidades_garantia,
    s.value * ss.quantity as valor_garantia
FROM loans l
INNER JOIN stocks s ON l.guaranteed_stock_id = s.id
INNER JOIN members m ON l.member_id = m.id
LEFT JOIN stock_subscriptions ss ON ss.member_id = l.member_id AND ss.stock_id = s.id AND ss.status = 'active'
WHERE l.loan_type IN ('agil', 'prioritario')
AND s.type = 'Bono Navideño'
ORDER BY l.loan_type, l.outstanding_balance DESC;
