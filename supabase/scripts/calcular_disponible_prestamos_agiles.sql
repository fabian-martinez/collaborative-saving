-- Script para calcular el monto disponible para préstamos ágiles y prioritarios
-- Fórmula: (Valor Bono Navideño * Número de suscripciones) - Monto prestado en ágiles pendiente - Monto prestado en prioritarios pendiente
-- 
-- Autor: Generado automáticamente
-- Fecha: 2025-11-18
-- Actualizado: Incluye préstamos ágiles y prioritarios

-- Paso 1: Obtener el valor de la acción Bono Navideño
WITH valor_bono_navideno AS (
    SELECT 
        s.id as stock_id,
        s.type as stock_type,
        s.value as valor_unitario
    FROM stocks s 
    WHERE s.type = 'Bono Navideño'
    LIMIT 1
),

-- Paso 2: Contar el total de suscripciones activas de Bono Navideño
total_suscripciones AS (
    SELECT 
        COUNT(*) as cantidad_suscripciones,
        COALESCE(SUM(ss.quantity), 0) as total_unidades
    FROM stock_subscriptions ss
    INNER JOIN valor_bono_navideno vbn ON ss.stock_id = vbn.stock_id
    WHERE ss.status = 'active'
),

-- Paso 3: Calcular el valor total de las acciones Bono Navideño
valor_total_bonos AS (
    SELECT 
        vbn.valor_unitario * ts.total_unidades as valor_total
    FROM valor_bono_navideno vbn
    CROSS JOIN total_suscripciones ts
),

-- Paso 4: Obtener el monto total prestado en ágiles pendiente por pagar
monto_prestado_agiles_pendiente AS (
    SELECT 
        COALESCE(SUM(l.outstanding_balance), 0) as total_pendiente
    FROM loans l
    WHERE l.loan_type = 'agil'
),

-- Paso 4b: Obtener el monto total prestado en prioritarios pendiente por pagar
monto_prestado_prioritarios_pendiente AS (
    SELECT 
        COALESCE(SUM(l.outstanding_balance), 0) as total_pendiente
    FROM loans l
    WHERE l.loan_type = 'prioritario'
)

-- Paso 5: Calcular el monto disponible para préstamos ágiles y prioritarios
SELECT 
    '=== CÁLCULO DE DISPONIBLE PARA PRÉSTAMOS ÁGILES Y PRIORITARIOS ===' as titulo,
    '' as separador_1,
    'Valor unitario Bono Navideño:' as concepto_1,
    vbn.valor_unitario as valor_unitario,
    '' as separador_2,
    'Total unidades suscritas (Bono Navideño):' as concepto_2,
    ts.total_unidades as total_unidades,
    '' as separador_3,
    'Valor total Bonos Navideños:' as concepto_3,
    vtb.valor_total as valor_total_bonos,
    '' as separador_4,
    'Monto prestado ágiles pendiente:' as concepto_4,
    mpa.total_pendiente as monto_prestado_agiles,
    '' as separador_5,
    'Monto prestado prioritarios pendiente:' as concepto_5,
    mpp.total_pendiente as monto_prestado_prioritarios,
    '' as separador_6,
    'Total prestado (Ágiles + Prioritarios):' as concepto_6,
    (mpa.total_pendiente + mpp.total_pendiente) as total_prestado,
    '' as separador_7,
    '===============================================' as separador_final,
    'MONTO DISPONIBLE PARA PRÉSTAMOS ÁGILES Y PRIORITARIOS:' as resultado_label,
    (vtb.valor_total - mpa.total_pendiente - mpp.total_pendiente) as monto_disponible
FROM valor_bono_navideno vbn
CROSS JOIN total_suscripciones ts
CROSS JOIN valor_total_bonos vtb
CROSS JOIN monto_prestado_agiles_pendiente mpa
CROSS JOIN monto_prestado_prioritarios_pendiente mpp;

-- Consulta alternativa más simple (solo el resultado)
WITH valor_bonos AS (
    SELECT 
        s.value * COALESCE(SUM(ss.quantity), 0) as valor_total
    FROM stocks s
    LEFT JOIN stock_subscriptions ss ON s.id = ss.stock_id AND ss.status = 'active'
    WHERE s.type = 'Bono Navideño'
    GROUP BY s.value
),
monto_prestado_agiles AS (
    SELECT 
        COALESCE(SUM(l.outstanding_balance), 0) as total_pendiente
    FROM loans l
    WHERE l.loan_type = 'agil'
),
monto_prestado_prioritarios AS (
    SELECT 
        COALESCE(SUM(l.outstanding_balance), 0) as total_pendiente
    FROM loans l
    WHERE l.loan_type = 'prioritario'
)
SELECT 
    vb.valor_total - mpa.total_pendiente - mpp.total_pendiente as monto_disponible_prestamos_agiles_y_prioritarios
FROM valor_bonos vb
CROSS JOIN monto_prestado_agiles mpa
CROSS JOIN monto_prestado_prioritarios mpp;
