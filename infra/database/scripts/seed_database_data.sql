-- =================================================================
--  SCRIPT PARA POBLAR LA BASE DE DATOS CON DATOS DE EJEMPLO
-- =================================================================
--  Propósito: Este script inserta un conjunto de datos coherente
--             para facilitar las pruebas y el desarrollo.
--             Debe ejecutarse DESPUÉS del script de migración.
-- =================================================================

-- Clean slate before seeding
TRUNCATE TABLE
  public.members,
  public.stocks,
  public.stock_types,
  public.mandatory_contributions,
  public.stock_subscriptions,
  public.operations,
  public.ledger_entries,
  public.meetings,
  public.loan_types,
  public.loans,
  public.loan_transaction_details,
  public.stock_value_history
RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------
-- ▤ Catalog Data
-- ----------------------------------------------------------------
-- Insertar tipos de acciones (catálogo)
INSERT INTO public.stock_types (id, code, name, behavior, is_guaranteed, guaranteed_yield, description) VALUES
('e1a1b1c1-1111-4444-9999-000000000001', 'ordinaria', 'Acción Ordinaria', 'CAPITAL_APPRECIATION', false, null, 'Acción estándar con participación en valorización de activos'),
('e1a1b1c1-1111-4444-9999-000000000002', 'preferencial', 'Acción Preferencial', 'CAPITAL_APPRECIATION', true, 0.0200, 'Acción con rendimiento preferencial garantizado del 2% mensual'),
('e1a1b1c1-1111-4444-9999-000000000003', 'grande', 'Acción Grande', 'CAPITAL_APPRECIATION', false, null, 'Acción de alta denominación con apreciación de capital'),
('e1a1b1c1-1111-4444-9999-000000000004', 'mediana', 'Acción Mediana', 'CAPITAL_APPRECIATION', false, null, 'Acción de mediana denominación'),
('e1a1b1c1-1111-4444-9999-000000000005', 'pequena', 'Acción Pequeña', 'CAPITAL_APPRECIATION', false, null, 'Acción de baja denominación'),
('e1a1b1c1-1111-4444-9999-000000000006', 'cdt', 'Certificado de Depósito a Término', 'DIVIDEND_YIELD', true, 0.0200, 'Instrumento de ahorro a plazo fijo con rendimiento garantizado')
ON CONFLICT (code) DO NOTHING;

-- Insertar tipos de préstamo
INSERT INTO public.loan_types (id, code, name, interest_rate, description) VALUES
('681c73c5-0f84-449e-9571-a685462e256f', 'corriente', 'Corriente', 0.0150, 'Préstamo corriente estándar con tasa del 1.5% mensual'),
('71e9aa90-84c2-4f6e-a9b5-f340d5a6362d', 'agil', 'Ágil', 0.0200, 'Préstamo ágil con tasa del 2.0% mensual'),
('01f640d4-9557-4169-9349-91b03f9abfbe', 'prioritario', 'Prioritario', 0.0200, 'Préstamo prioritario para emergencias con tasa del 2.0% mensual'),
('f2bdfc87-cdcc-42ee-b941-d435d0489448', 'accion', 'Acción', 0.0150, 'Préstamo para financiación de acciones con tasa del 1.5% mensual')
ON CONFLICT (code) DO NOTHING;

-- Insertar tipos de acciones
INSERT INTO public.stocks (id, type, value, monthly_contribution, is_guaranteed, guaranteed_yield) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d478', 'Acción Preferencial', 1000.00, 100.00, true, 0.02), -- Acción con rendimiento garantizado del 2%
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Acción Grande', 1000.00, 100.00, false, null),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Acción Mediana', 500.00, 50.00, false, null),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Acción Pequeña', 250.00, 25.00, false, null);

-- Insertar contribuciones obligatorias
INSERT INTO public.mandatory_contributions (asset_type, value) VALUES
('Cuota de Administración', 5.00),
('Fondo para Actividades Sociales', 2.00);


-- ----------------------------------------------------------------
-- ▤ Members
-- ----------------------------------------------------------------
INSERT INTO public.members (id, name, email, identification_number, role) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ana García (Admin)', 'ana.garcia@email.com', '123456781', 'admin'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Carlos Sánchez', 'carlos.sanchez@email.com', '123456782', 'member'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Beatriz Fernández', 'beatriz.fernandez@email.com', '123456783', 'member'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'David Rodríguez', 'david.rodriguez@email.com', '123456784', 'member');


-- Crear préstamos activos para socios
INSERT INTO public.loans (id, member_id, loan_type, approved_amount, interest_rate, status, monthly_payment_amount) VALUES
-- Préstamo para Carlos
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'corriente', 2000.00, 0.05, 'active', 150.00),
-- Préstamo para David para que tenga obligaciones
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'agil', 500.00, 0.08, 'active', 50.00);

-- ----------------------------------------------------------------
-- ▤ Historical & State Data
-- ----------------------------------------------------------------

-- Suscripciones de acciones de los socios
INSERT INTO public.stock_subscriptions (member_id, stock_id, quantity, financing_loan_id) VALUES
-- Ana (Admin) tiene 2 acciones grandes
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 2, NULL),
-- Carlos tiene 1.5 acción mediana y 1 preferencial (ejemplo fraccionado)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 1.5, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f47ac10b-58cc-4372-a567-0e02b2c3d478', 1, NULL),
-- Beatriz tiene 3.25 acciones pequeñas (ejemplo fraccionado)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 3.25, NULL),
-- David tiene 1 acción mediana comprada con el préstamo 'agil'
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 1, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22');

-- Crear una reunión activa y una cerrada
INSERT INTO public.meetings (id, date, status) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', NOW() - INTERVAL '1 month', 'closed'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', NOW(), 'active');


-- Operaciones de la REUNIÓN CERRADA
-- ---------------------------------
-- Desembolso del préstamo de Carlos en la reunión pasada
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Desembolso Préstamo Corriente a Carlos', 'LOAN_DISBURSEMENT');

-- Pago mensual de Ana en la reunión pasada
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Pago mensual Ana', 'MONTHLY_PAYMENT');

-- Pago mensual de Beatriz en la reunión pasada
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Pago mensual Beatriz', 'MONTHLY_PAYMENT');

-- Pago mensual de David en la reunión pasada
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Pago mensual David', 'MONTHLY_PAYMENT');


-- Asientos Contables de la REUNIÓN CERRADA
-- ------------------------------------------
-- Asientos para el desembolso del préstamo de Carlos
INSERT INTO public.ledger_entries(operation_id, account_type, amount, loan_id, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'CASH', -2000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'Salida de efectivo por desembolso de préstamo a Carlos'), -- Sale de caja
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'LOANS_RECEIVABLE', 2000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'Aumento de cuenta por cobrar por préstamo a Carlos'); -- Aumenta la cuenta por cobrar

-- Asientos para el pago de Ana (2 Acciones Grandes + Cuotas)
INSERT INTO public.ledger_entries(operation_id, account_type, amount, stock_id, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'CASH', 207.00, NULL, 'Ingreso de efectivo por pago mensual de Ana'), -- (2*100) + 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'STOCK_CAPITAL', -200.00, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Aporte de capital por acciones grandes de Ana'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'MANDATORY_CONTRIBUTION_INCOME', -7.00, NULL, 'Ingreso por contribuciones obligatorias de Ana');

-- Asientos para el pago de Beatriz (3 Acciones Pequeñas + Cuotas)
INSERT INTO public.ledger_entries(operation_id, account_type, amount, stock_id, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'CASH', 82.00, NULL, 'Ingreso de efectivo por pago mensual de Beatriz'), -- (3*25) + 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'STOCK_CAPITAL', -75.00, 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Aporte de capital por acciones pequeñas de Beatriz'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'MANDATORY_CONTRIBUTION_INCOME', -7.00, NULL, 'Ingreso por contribuciones obligatorias de Beatriz');

-- Asientos para el pago de David (Solo Cuotas)
INSERT INTO public.ledger_entries(operation_id, account_type, amount, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', 'CASH', 7.00, 'Ingreso de efectivo por pago mensual de David'), -- 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', 'MANDATORY_CONTRIBUTION_INCOME', -7.00, 'Ingreso por contribuciones obligatorias de David');


-- Operaciones de la REUNIÓN ACTIVA
-- ---------------------------------
-- Simular una operación de pago por parte de Beatriz (esto podría eliminarse o mantenerse para pruebas)
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'Pago de cuotas en reunión activa', 'MONTHLY_PAYMENT');

-- Asientos contables para la operación de Beatriz en reunión activa
INSERT INTO public.ledger_entries(operation_id, account_type, amount, stock_id, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'CASH', 82.00, NULL, 'Ingreso de efectivo por pago mensual de Beatriz en reunión activa'), -- (3*25) + 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'MANDATORY_CONTRIBUTION_INCOME', -7.00, NULL, 'Ingreso por contribuciones obligatorias de Beatriz en reunión activa'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'STOCK_CAPITAL', -75.00, 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Aporte de capital por acciones pequeñas de Beatriz en reunión activa');

-- Solicitudes de pagos pendientes (ejemplo)
INSERT INTO public.pending_member_payments (member_id, meeting_id, type, amount, status, notes) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'dividendo', 120.00, 'pending', 'Solicitud de pago de dividendos para Carlos'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'retiro_accion', 300.00, 'pending', 'Retiro parcial de acciones solicitado por Beatriz');


-- Historial y Estado Actual
-- ---------------------------
-- Transacciones del préstamo de Carlos
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'disbursement', 2000.00);

-- Transacciones del préstamo de David (solo desembolso)
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Desembolso Préstamo Ágil a David', 'LOAN_DISBURSEMENT');
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'disbursement', 500.00);

-- Asientos contables para el desembolso del préstamo de David
INSERT INTO public.ledger_entries(operation_id, account_type, amount, loan_id, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'CASH', -500.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Salida de efectivo por desembolso de préstamo ágil a David'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'LOANS_RECEIVABLE', 500.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Aumento de cuenta por cobrar por préstamo ágil a David');


-- ----------------------------------------------------------------
-- ▤ Confirmation
-- ----------------------------------------------------------------
SELECT '¡Base de datos poblada con datos de ejemplo!'; 