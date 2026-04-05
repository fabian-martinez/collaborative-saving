/**
 * Utilidades generales
 */

// Suma los montos de los ledger_entries de tipo 'CASH' de un array de operaciones
// Compatible con ambos formatos: ledgerEntries/ledger_entries y accountType/account_type
export function sumCashEntries(operations: {
  ledger_entries?: { account_type?: string; accountType?: string; amount: number | string }[];
  ledgerEntries?: { account_type?: string; accountType?: string; amount: number | string }[];
}[]): number {
  if (!operations) return 0;
  return operations.reduce((sum, op) => {
    // Compatibilidad con ambos formatos
    const entries = op.ledgerEntries || op.ledger_entries;
    if (!entries) return sum;

    const cashSum = entries
      .filter(entry => {
        const accountType = entry.accountType || entry.account_type;
        return accountType === 'CASH';
      })
      .reduce((acc, entry) => acc + (Number(entry.amount) || 0), 0);
    return sum + cashSum;
  }, 0);
}

// Suma los montos de un array de ledger_entries de tipo 'CASH'
export function sumCashFromEntries(entries: { account_type: string; amount: number | string }[]): number {
  if (!entries) return 0;
  return entries
    .filter(entry => entry.account_type === 'CASH')
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
}
