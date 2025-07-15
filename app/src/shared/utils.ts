// Suma los montos de los ledger_entries de tipo 'CASH' de un array de operaciones
export function sumCashEntries(operations: { ledger_entries?: { account_type: string; amount: number | string }[] }[]): number {
  if (!operations) return 0;
  return operations.reduce((sum, op) => {
    if (!op.ledger_entries) return sum;
    const cashSum = op.ledger_entries
      .filter(entry => entry.account_type === 'CASH')
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