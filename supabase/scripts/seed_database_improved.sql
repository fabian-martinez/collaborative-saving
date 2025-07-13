-- =================================================================
--  SCRIPT MEJORADO PARA POBLAR LA BASE DE DATOS CON DATOS REALISTAS
-- =================================================================
--  Propósito: Este script inserta un conjunto de datos realistas
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
  public.stock_value_history,
  public.pending_member_payments
RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------
-- ▤ Tipos de Acciones
-- ----------------------------------------------------------------
INSERT INTO public.stocks (id, type, value, monthly_contribution, is_guaranteed, guaranteed_yield) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d478', 'Bono Navideño', 25.00, 5.00, false, null),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Acción Grande', 20000.00, 10.00, false, null),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Acción Mediana', 5000.00, 20.00, false, null),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Acción Especial', 50000.00, 0.00, true, 0.08);

-- ----------------------------------------------------------------
-- ▤ Contribuciones Obligatorias
-- ----------------------------------------------------------------
INSERT INTO public.mandatory_contributions (asset_type, value) VALUES
('Cuota de Administración', 5.00),
('Fondo para Actividades Sociales', 3.00),
('Seguro Colectivo', 2.00);

-- ----------------------------------------------------------------
-- ▤ Socios
-- ----------------------------------------------------------------
INSERT INTO public.members (id, name, email, identification_number, role) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'María Elena Rodríguez', 'maria.rodriguez@email.com', '1234567890', 'member'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Carlos Alberto Sánchez', 'carlos.sanchez@email.com', '1234567891', 'member'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Ana Patricia Gómez', 'ana.gomez@email.com', '1234567892', 'member'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Luis Fernando Vargas', 'luis.vargas@email.com', '1234567893', 'admin'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Sandra Milena Torres', 'sandra.torres@email.com', '1234567894', 'member');

-- ----------------------------------------------------------------
-- ▤ Préstamos de los Socios
-- ----------------------------------------------------------------

-- Socio 1: Préstamo Ágil de 200
INSERT INTO public.loans (id, member_id, loan_type, approved_amount, interest_rate, status, monthly_payment_amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'agil', 200.00, 0.02, 'active', 0.00);

-- Socio 2: Préstamo Corriente de 70000
INSERT INTO public.loans (id, member_id, loan_type, approved_amount, interest_rate, status, monthly_payment_amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'corriente', 70000.00, 0.015, 'active', 1050.00);

-- Socio 4: Préstamo Corriente de 80300 y Préstamo Ágil de 130
INSERT INTO public.loans (id, member_id, loan_type, approved_amount, interest_rate, status, monthly_payment_amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'corriente', 90000.00, 0.015, 'active', 100.00),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b24', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'agil', 130.00, 0.02, 'active', 0.00);

-- Socio 5: Préstamo Corriente de 50000 y Préstamo Acción para Acción Grande
INSERT INTO public.loans (id, member_id, loan_type, approved_amount, interest_rate, status, monthly_payment_amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b25', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'corriente', 50000.00, 0.015, 'active', 700.00),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b26', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'accion', 20000.00, 0.012, 'active', 0.00);

-- ----------------------------------------------------------------
-- ▤ Suscripciones de Acciones
-- ----------------------------------------------------------------

-- Socio 1: 2 Acciones Grandes, 3 Bonos Navideños
INSERT INTO public.stock_subscriptions (member_id, stock_id, quantity, financing_loan_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 2, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f47ac10b-58cc-4372-a567-0e02b2c3d478', 3, NULL);

-- Socio 2: 1 Acción Especial, 5 Bonos Navideños
INSERT INTO public.stock_subscriptions (member_id, stock_id, quantity, financing_loan_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 1, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f47ac10b-58cc-4372-a567-0e02b2c3d478', 5, NULL);

-- Socio 3: 1 Acción Grande, 2 Acciones Medianas, 4 Bonos Navideños
INSERT INTO public.stock_subscriptions (member_id, stock_id, quantity, financing_loan_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 1, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 2, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f47ac10b-58cc-4372-a567-0e02b2c3d478', 4, NULL);

-- Socio 4: 1 Acción Especial
INSERT INTO public.stock_subscriptions (member_id, stock_id, quantity, financing_loan_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 1, NULL);

-- Socio 5: 1 Acción Mediana, 1 Acción Grande financiada con préstamo
INSERT INTO public.stock_subscriptions (member_id, stock_id, quantity, financing_loan_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 1, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 1, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b26');

-- ----------------------------------------------------------------
-- ▤ Reuniones Históricas (No hay reuniones activas)
-- ----------------------------------------------------------------
INSERT INTO public.meetings (id, date, status) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', NOW() - INTERVAL '3 months', 'closed'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', NOW() - INTERVAL '2 months', 'closed'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', NOW() - INTERVAL '1 month', 'closed');

-- ----------------------------------------------------------------
-- ▤ Operaciones Históricas
-- ----------------------------------------------------------------

-- Desembolsos de préstamos
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
-- Socio 1: Desembolso préstamo ágil
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Desembolso Préstamo Ágil - María Elena', 'LOAN_DISBURSEMENT'),
-- Socio 2: Desembolso préstamo corriente
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'Desembolso Préstamo Corriente - Carlos Alberto', 'LOAN_DISBURSEMENT'),
-- Socio 4: Desembolsos préstamos
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'Desembolso Préstamo Corriente - Luis Fernando', 'LOAN_DISBURSEMENT'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Desembolso Préstamo Ágil - Luis Fernando', 'LOAN_DISBURSEMENT'),
-- Socio 5: Desembolsos préstamos
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Desembolso Préstamo Corriente - Sandra Milena', 'LOAN_DISBURSEMENT'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'Desembolso Préstamo Acción - Sandra Milena', 'LOAN_DISBURSEMENT');

-- Pagos de préstamos
INSERT INTO public.operations (id, member_id, meeting_id, description, type) VALUES
-- Socio 1: Pago préstamo ágil
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'Pago Préstamo Ágil - María Elena', 'LOAN_PAYMENT'),
-- Socio 5: Pago préstamo corriente
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Pago Préstamo Corriente - Sandra Milena', 'LOAN_PAYMENT');

-- ----------------------------------------------------------------
-- ▤ Detalles de Transacciones de Préstamos
-- ----------------------------------------------------------------

-- Socio 1: Préstamo Ágil - Desembolso y Pago
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'desembolso', 200.00),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'abono_capital', 130.00);

-- Socio 2: Préstamo Corriente - Desembolso
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'desembolso', 50000.00);

-- Socio 4: Préstamos - Desembolsos
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'desembolso', 80300.00),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b24', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'desembolso', 130.00);

-- Socio 5: Préstamos - Desembolsos y Pago
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b25', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'desembolso', 50000.00),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b26', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'desembolso', 15000.00),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b25', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'abono_capital', 300.00);

-- ----------------------------------------------------------------
-- ▤ Asientos Contables
-- ----------------------------------------------------------------

-- Desembolsos de préstamos (Salida de efectivo, aumento de cuentas por cobrar)
INSERT INTO public.ledger_entries(operation_id, account_type, amount, loan_id, description) VALUES
-- Socio 1: Préstamo Ágil
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'CASH', -200.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'Desembolso préstamo ágil María Elena'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'LOANS_RECEIVABLE', 200.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'Cuenta por cobrar préstamo ágil María Elena'),
-- Socio 2: Préstamo Corriente
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'CASH', -50000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Desembolso préstamo corriente Carlos Alberto'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'LOANS_RECEIVABLE', 50000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Cuenta por cobrar préstamo corriente Carlos Alberto'),
-- Socio 4: Préstamos
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'CASH', -80300.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', 'Desembolso préstamo corriente Luis Fernando'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'LOANS_RECEIVABLE', 80300.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b23', 'Cuenta por cobrar préstamo corriente Luis Fernando'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'CASH', -130.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b24', 'Desembolso préstamo ágil Luis Fernando'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'LOANS_RECEIVABLE', 130.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b24', 'Cuenta por cobrar préstamo ágil Luis Fernando'),
-- Socio 5: Préstamos
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'CASH', -50000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b25', 'Desembolso préstamo corriente Sandra Milena'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'LOANS_RECEIVABLE', 50000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b25', 'Cuenta por cobrar préstamo corriente Sandra Milena'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'CASH', -15000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b26', 'Desembolso préstamo acción Sandra Milena'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'LOANS_RECEIVABLE', 15000.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b26', 'Cuenta por cobrar préstamo acción Sandra Milena');

-- Pagos de préstamos (Entrada de efectivo, disminución de cuentas por cobrar)
INSERT INTO public.ledger_entries(operation_id, account_type, amount, loan_id, description) VALUES
-- Socio 1: Pago préstamo ágil
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'CASH', 130.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'Pago préstamo ágil María Elena'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'LOANS_RECEIVABLE', -130.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'Reducción cuenta por cobrar préstamo ágil María Elena'),
-- Socio 5: Pago préstamo corriente
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'CASH', 300.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b25', 'Pago préstamo corriente Sandra Milena'),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'LOANS_RECEIVABLE', -300.00, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b25', 'Reducción cuenta por cobrar préstamo corriente Sandra Milena');

-- ----------------------------------------------------------------
-- ▤ Confirmación
-- ----------------------------------------------------------------
SELECT '¡Base de datos poblada con datos mejorados y realistas!'; 