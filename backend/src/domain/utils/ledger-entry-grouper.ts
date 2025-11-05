import { LedgerEntry } from '../entities/ledger-entry.entity';

/**
 * Ledger Entry Grouper
 *
 * Utility class for grouping ledger entries by operation.
 * This is a reusable domain utility that can be used across different query handlers.
 */
export class LedgerEntryGrouper {
  /**
   * Groups ledger entries by their operation ID.
   *
   * @param entries - Array of ledger entries to group
   * @returns Map where key is operationId and value is array of entries for that operation
   */
  static groupByOperation(entries: LedgerEntry[]): Map<string, LedgerEntry[]> {
    const grouped = new Map<string, LedgerEntry[]>();

    for (const entry of entries) {
      const operationId = entry.operationId;
      if (!grouped.has(operationId)) {
        grouped.set(operationId, []);
      }
      grouped.get(operationId)!.push(entry);
    }

    return grouped;
  }
}
