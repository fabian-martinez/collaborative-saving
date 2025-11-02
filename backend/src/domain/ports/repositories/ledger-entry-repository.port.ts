import { LedgerEntry } from '../../../ledger-entries/entities/ledger-entry.entity';

export interface LedgerEntryRepository {
  findById(id: string): Promise<LedgerEntry | null>;
  save(entry: Partial<LedgerEntry>): Promise<LedgerEntry>;
  saveMany(entries: Partial<LedgerEntry>[]): Promise<LedgerEntry[]>;
}
