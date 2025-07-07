export interface Operation {
  id: string;
  meeting_id: string;
  member_id: string;
  type: string;
  date: string;
  description: string;
  ledger_entries: LedgerEntry[];
  total_debit: number;
  total_credit: number;
}

export interface LedgerEntry {
    id: string;
    operation_id: string;
    account_type: string;
    amount: number;
    created_at: string;
    description: string;
  }