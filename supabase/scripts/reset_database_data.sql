-- =================================================================
--  SCRIPT PARA LIMPIAR DATOS DE LA BASE DE DATOS
-- =================================================================
--  Propósito: Este script vacía todas las tablas transaccionales
--             para reiniciar el escenario de prueba sin afectar
--             la estructura (esquema) de la base de datos.
--
--  Uso:       Ejecutar este script para tener un lienzo limpio
--             antes de correr pruebas o validaciones de casos de uso.
-- =================================================================

-- Desactiva temporalmente los triggers para evitar problemas de dependencias complejas, si los hubiera.
SET session_replication_role = 'replica';

TRUNCATE TABLE
  public.members,
  public.stocks,
  public.mandatory_contributions,
  public.stock_subscriptions,
  public.operations,
  public.ledger_entries,
  public.meetings
RESTART IDENTITY CASCADE;

-- Reactiva los triggers.
SET session_replication_role = 'origin';

-- Mensaje de confirmación
SELECT '¡Base de datos limpiada y lista para las pruebas!'; 