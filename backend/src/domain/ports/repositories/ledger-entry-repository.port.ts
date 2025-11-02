import { LedgerEntry } from '../../entities/ledger-entry.entity';

export interface LedgerEntryRepository {
  findById(id: string): Promise<LedgerEntry | null>;
  findByOperation(operationId: string): Promise<LedgerEntry[]>;
  findByMeeting(meetingId: string): Promise<LedgerEntry[]>;
  findByAccountType(accountType: string): Promise<LedgerEntry[]>;
  save(entry: LedgerEntry): Promise<LedgerEntry>;
  saveMany(entries: LedgerEntry[]): Promise<LedgerEntry[]>;
  sumByAccountType(accountType: string): Promise<number>;
}
