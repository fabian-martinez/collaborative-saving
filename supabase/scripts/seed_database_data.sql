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
INSERT INTO public.mandatory_contributions (asset_type, total) VALUES
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
-- David no tiene acciones aún

-- Crear una reunión activa y una cerrada
INSERT INTO public.meetings (id, date, status) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', NOW() - INTERVAL '1 month', 'closed'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', NOW(), 'active');

-- Crear un préstamo activo para un socio (Carlos)
INSERT INTO public.loans (id, member_id, loan_type, approved_amount, interest_rate, status, monthly_payment_amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'corriente', 2000.00, 0.05, 'active', 150.00);

-- Operación para el desembolso del préstamo de Carlos en la reunión pasada
INSERT INTO public.operations (id, member_id, meeting_id, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 'Desembolso de Préstamo Corriente');

-- Añadir transacciones para simular el estado del préstamo de Carlos
-- Desembolso inicial (asociado a la operación de la reunión)
INSERT INTO public.loan_transaction_details (loan_id, operation_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'desembolso', 2000.00);
-- Abono a capital para llegar al saldo de 1500 (sin reunión asociada)
INSERT INTO public.loan_transaction_details (loan_id, transaction_type, amount) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21', 'abono_capital', 500.00);

-- Simular una operación de pago en la reunión activa por parte de Beatriz
INSERT INTO public.operations (id, member_id, meeting_id, description) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 'Pago de cuotas en reunión');

-- Asientos contables para la operación de Beatriz
INSERT INTO public.ledger_entries(operation_id, account_type, amount) VALUES
-- Débito a la caja/banco por el total recibido
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'cash_assets', 82.00), -- 75 (acciones) + 5 (admin) + 2 (social)
-- Crédito a la cuenta de aportes obligatorios de Beatriz
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'mandatory_contributions_beatriz', -7.00),
-- Crédito a la cuenta de capital en acciones de Beatriz
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'stock_capital_beatriz', -75.00); -- 3 acciones pequeñas * 25

-- ----------------------------------------------------------------
-- ▤ Confirmation
-- ----------------------------------------------------------------
SELECT '¡Base de datos poblada con datos de ejemplo!'; 