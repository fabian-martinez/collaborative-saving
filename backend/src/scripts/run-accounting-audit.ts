import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Mapa de heurísticas: Qué cuentas están permitidas para cada tipo de operación
const ALLOWED_ACCOUNTS_PER_OPERATION: Record<string, string[]> = {
  STOCK_PURCHASE: ['CASH', 'STOCK_CAPITAL'],
  MANDATORY_CONTRIBUTION: ['CASH', 'MANDATORY_CONTRIBUTION_INCOME'],
  LOAN_DISBURSEMENT: ['CASH', 'LOANS_RECEIVABLE', 'MEMBER_EQUITY'],
  LOAN_PAYMENT: [
    'CASH',
    'LOANS_RECEIVABLE',
    'INTEREST_INCOME',
    'INSURANCE_INCOME',
  ],
  MONTHLY_PAYMENT: [
    'CASH',
    'LOANS_RECEIVABLE',
    'INTEREST_INCOME',
    'INSURANCE_INCOME',
    'STOCK_CAPITAL',
    'MANDATORY_CONTRIBUTION_INCOME',
    'FEE_INCOME',
    'NOVELTY_LOSS',
  ],
  FEE: ['CASH', 'FEE_INCOME'],
  STOCK_TRANSFER: ['STOCK_CAPITAL', 'STOCK_TRANSFER'],
  DIVIDEND_PAYMENT: ['CASH', 'DIVIDENDS_PAYABLE', 'DIVIDEND_EXPENSE'],
  ASSET_REVALUATION: ['INVESTMENT_IN_STOCKS', 'REVALUATION_SURPLUS'],
  OTHER_WITHDRAWAL: ['CASH', 'OTHER_EXPENSES'],
  STOCK_WITHDRAWAL: ['CASH', 'STOCK_CAPITAL'],
  STOCK_MODIFICATION: ['CASH', 'STOCK_CAPITAL', 'LOANS_RECEIVABLE'],
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const args = process.argv.slice(2);
  const year = parseInt(args[0]);
  const month = parseInt(args[1]);

  if (!year || !month) {
    console.log(
      'Uso: npx ts-node backend/src/scripts/run-accounting-audit.ts <YEAR> <MONTH>',
    );
    process.exit(1);
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  console.log(`\n🔍 Generando Reporte Manual de Auditoría...`);
  console.log(
    `📅 Periodo: ${startDate.toISOString()} hasta ${endDate.toISOString()}\n`,
  );

  // Obtener todas las operaciones y sus entries del mes
  const query = `
    SELECT o.id as "operationId", o.date, o.type, o.description as "opDescription",
           le.account_type as "accountType", le.amount, le.description as "leDescription"
    FROM operations o
    JOIN ledger_entries le ON o.id = le.operation_id
    WHERE o.date >= $1 AND o.date <= $2
    ORDER BY o.date ASC, o.id ASC
  `;
  const rawData: Array<{
    operationId: string;
    date: Date;
    type: string;
    opDescription: string;
    accountType: string;
    amount: string;
    leDescription: string;
  }> = await dataSource.query(query, [startDate, endDate]);

  // Agrupar por operationId
  interface OperationAudit {
    id: string;
    date: Date;
    type: string;
    description: string;
    entries: Array<{ account: string; amount: number; desc: string }>;
    balance: number;
    alerts: string[];
  }
  const operationsMap = new Map<string, OperationAudit>();
  for (const row of rawData) {
    if (!operationsMap.has(row.operationId)) {
      operationsMap.set(row.operationId, {
        id: row.operationId,
        date: row.date,
        type: row.type,
        description: row.opDescription,
        entries: [],
        balance: 0,
        alerts: [],
      });
    }
    const op = operationsMap.get(row.operationId)!;
    const amount = parseFloat(row.amount);
    op.entries.push({
      account: row.accountType,
      amount: amount,
      desc: row.leDescription,
    });
    op.balance += amount;

    // Heurística
    const allowed = ALLOWED_ACCOUNTS_PER_OPERATION[op.type];
    if (allowed && !allowed.includes(row.accountType)) {
      op.alerts.push(
        `La cuenta \`${row.accountType}\` no es usual para una operación \`${op.type}\`.`,
      );
    }
  }

  // Escribir Markdown
  let md = `# Reporte de Auditoría Manual\n**Periodo:** ${year}-${month}\n\n`;

  for (const op of operationsMap.values()) {
    const balanceRound = Math.round(op.balance * 100) / 100;
    md += `## Operación: \`${op.type}\`\n`;
    md += `- **Fecha:** ${op.date.toISOString()}\n`;
    md += `- **ID:** \`${op.id}\`\n`;
    md += `- **Descripción:** ${op.description || 'N/A'}\n`;

    if (balanceRound !== 0) {
      md += `> [!CAUTION]\n> **Balance Descuadrado:** ${balanceRound}\n\n`;
    } else {
      md += `> [!NOTE]\n> Balance: 0.00 (OK)\n\n`;
    }

    if (op.alerts.length > 0) {
      for (const alert of op.alerts) {
        md += `> [!WARNING]\n> ${alert}\n\n`;
      }
    }

    md += `| Cuenta | Débito (+) | Crédito (-) | Descripción |\n`;
    md += `|---|---|---|---|\n`;

    for (const entry of op.entries) {
      const isDebit = entry.amount > 0;
      const val = Math.abs(entry.amount).toFixed(2);
      md += `| ${entry.account} | ${isDebit ? val : ''} | ${!isDebit ? val : ''} | ${entry.desc || ''} |\n`;
    }
    md += `\n---\n\n`;
  }

  const reportFilename = `audit-review-${year}-${month}.md`;
  const reportPath = path.join(__dirname, `../../${reportFilename}`);
  fs.writeFileSync(reportPath, md);

  console.log(`✅ Reporte Markdown generado con éxito.`);
  console.log(`📄 Archivo: backend/${reportFilename}`);

  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
