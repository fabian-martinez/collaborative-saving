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
  public.mandatory_contributions,
  public.stock_subscriptions,
  public.operations,
  public.ledger_entries,
  public.meetings,
  public.loans,
  public.loan_transaction_details,
  public.stock_value_history
RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------
-- ▤ Catalog Data
-- ----------------------------------------------------------------
-- Insertar tipos de acciones
INSERT INTO public.stocks (id, type, value, monthly_contribution) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Acción Grande', 1000.00, 100.00),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Acción Mediana', 500.00, 50.00),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Acción Pequeña', 250.00, 25.00),
('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'Bono Navideño', 100.00, 10.00);

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


-- ----------------------------------------------------------------
-- ▤ Historical & State Data
-- ----------------------------------------------------------------

-- Suscripciones de acciones de los socios
INSERT INTO public.stock_subscriptions (member_id, stock_id, quantity) VALUES
-- Ana (Admin) tiene 2 acciones grandes
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 2),
-- Carlos tiene 1 acción mediana y 5 bonos navideños
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f47ac10b-58cc-4372-a567-0e02b2c3d482', 5),
-- Beatriz tiene 3 acciones pequeñas
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 3);
-- David no tenía acciones, se le asignará un préstamo.

-- Crear una reunión activa y una cerrada
INSERT INTO public.meetings (id, date, status) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', NOW() - INTERVAL '1 month', 'closed'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', NOW(), 'active');

-- Crear préstamos activos para socios
INSERT INTO public.loans (id, member_id, loan_type, approved_amount, interest_rate, status, monthly_payment_amount) VALUES
-- Préstamo para Carlos
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'corriente', 2000.00, 0.05, 'active', 150.00),
-- Préstamo para David para que tenga obligaciones
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'agil', 500.00, 0.08, 'active', 50.00);


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
INSERT INTO public.ledger_entries(operation_id, account_type, amount) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'CASH', -2000.00), -- Sale de caja
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'LOANS_RECEIVABLE', 2000.00); -- Aumenta la cuenta por cobrar

-- Asientos para el pago de Ana (2 Acciones Grandes + Cuotas)
INSERT INTO public.ledger_entries(operation_id, account_type, amount) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'CASH', 207.00), -- (2*100) + 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'STOCK_CAPITAL', -200.00),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'MANDATORY_CONTRIBUTION_INCOME', -7.00);

-- Asientos para el pago de Beatriz (3 Acciones Pequeñas + Cuotas)
INSERT INTO public.ledger_entries(operation_id, account_type, amount) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'CASH', 82.00), -- (3*25) + 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'STOCK_CAPITAL', -75.00),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'MANDATORY_CONTRIBUTION_INCOME', -7.00);

-- Asientos para el pago de David (Solo Cuotas)
INSERT INTO public.ledger_entries(operation_id, account_type, amount) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'CASH', 7.00), -- 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'MANDATORY_CONTRIBUTION_INCOME', -7.00);


-- Operaciones de la REUNIÓN ACTIVA
-- ---------------------------------
-- Simular una operación de pago por parte de Beatriz (esto podría eliminarse o mantenerse para pruebas)
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'Pago de cuotas en reunión activa', 'MONTHLY_PAYMENT');

-- Asientos contables para la operación de Beatriz en reunión activa
INSERT INTO public.ledger_entries(operation_id, account_type, amount) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'CASH', 82.00), -- (3*25) + 5 + 2
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'MANDATORY_CONTRIBUTION_INCOME', -7.00),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'STOCK_CAPITAL', -75.00);


-- Historial y Estado Actual
-- ---------------------------
-- Transacciones del préstamo de Carlos
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'desembolso', 2000.00);

-- Transacciones del préstamo de David (solo desembolso)
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Desembolso Préstamo Ágil a David', 'LOAN_DISBURSEMENT');
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'desembolso', 500.00);


-- ----------------------------------------------------------------
-- ▤ Confirmation
-- ----------------------------------------------------------------
SELECT '¡Base de datos poblada con datos de ejemplo!'; 