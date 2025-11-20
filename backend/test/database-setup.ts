import { readFileSync } from 'fs';
import { join } from 'path';
import { EntityManager } from 'typeorm';

/**
 * Ejecuta un script SQL desde un archivo
 */
export async function executeSqlFile(
  entityManager: EntityManager,
  filePath: string,
): Promise<void> {
  try {
    const sql = readFileSync(filePath, 'utf-8');
    // Dividir el script en statements individuales
    // Remover comentarios y líneas vacías
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim().length > 0) {
        try {
          await entityManager.query(statement);
        } catch (error) {
          // Algunos errores son esperados (como "already exists")
          // Solo lanzar error si no es un error esperado
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            !errorMessage.includes('already exists') &&
            !errorMessage.includes('does not exist')
          ) {
            console.warn(`Warning executing SQL: ${errorMessage}`);
            console.warn(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading SQL file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Ejecuta la migración inicial de la base de datos
 */
export async function runMigrations(
  entityManager: EntityManager,
): Promise<void> {
  const migrationPath = join(
    __dirname,
    '../../supabase/migrations/0001_initial_tables.sql',
  );
  console.log('Running migrations from:', migrationPath);
  await executeSqlFile(entityManager, migrationPath);
  console.log('Migrations completed');
}

/**
 * Limpia todas las tablas de la base de datos
 */
export async function cleanDatabase(
  entityManager: EntityManager,
): Promise<void> {
  const tables = [
    'ledger_entries',
    'operations',
    'pending_member_payments',
    'loan_transaction_details',
    'loans',
    'stock_subscriptions',
    'stock_value_history',
    'meetings',
    'mandatory_contributions',
    'stocks',
    'members',
  ];

  // Desactivar temporalmente las restricciones de clave foránea
  await entityManager.query('SET session_replication_role = replica;');

  for (const table of tables) {
    try {
      await entityManager.query(`DELETE FROM "${table}"`);
    } catch (error) {
      // Ignorar errores si la tabla no existe
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('does not exist')) {
        console.warn(`Warning cleaning table ${table}:`, errorMessage);
      }
    }
  }

  // Reactivar las restricciones de clave foránea
  await entityManager.query('SET session_replication_role = DEFAULT;');
}
