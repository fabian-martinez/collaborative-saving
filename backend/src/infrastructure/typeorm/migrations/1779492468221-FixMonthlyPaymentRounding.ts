import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMonthlyPaymentRounding1779492468221 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Encontrar todas las operaciones MONTHLY_PAYMENT descuadradas en cualquier fecha
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const unbalancedOperations: Array<{
      operationId: string;
      balance: string;
    }> = await queryRunner.query(`
            SELECT o.id as "operationId", SUM(le.amount) as balance
            FROM operations o
            JOIN ledger_entries le ON o.id = le.operation_id
            WHERE o.type = 'MONTHLY_PAYMENT'
            GROUP BY o.id
            HAVING ROUND(SUM(le.amount)::numeric, 2) != 0
        `);

    for (const op of unbalancedOperations) {
      const balance = parseFloat(op.balance);
      if (balance === 0) continue;

      // Si balance > 0 (Debitos > Creditos), necesitamos un Credito (amount < 0)
      // Sobró efectivo físico, es un ingreso sin clasificar: FEE_INCOME (-balance)
      // Si balance < 0 (Creditos > Debitos), necesitamos un Debito (amount > 0)
      // Faltó efectivo para cubrir la teoría, es una pérdida: NOVELTY_LOSS (-balance)
      const adjustmentAmount = -balance;
      const accountType = balance > 0 ? 'FEE_INCOME' : 'NOVELTY_LOSS';

      // Insertar el asiento de ajuste
      await queryRunner.query(
        `
                INSERT INTO ledger_entries (id, operation_id, account_type, amount, description, created_at, updated_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
            `,
        [
          op.operationId,
          accountType,
          adjustmentAmount,
          'Ajuste automático de redondeo (Fix DB)',
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM ledger_entries 
            WHERE description = 'Ajuste automático de redondeo (Fix DB)'
        `);
  }
}
