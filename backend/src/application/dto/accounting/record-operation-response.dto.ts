/**
 * Record Operation Response DTO
 *
 * Output DTO returned after successfully recording an accounting operation.
 * Contains the created operation ID and the ledger entry IDs.
 */
export interface RecordOperationResponseDto {
  operationId: string;
  ledgerEntryIds: string[];
}
