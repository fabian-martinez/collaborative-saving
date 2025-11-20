/**
 * Execute Disbursement Plan Response DTO
 *
 * Response DTO after executing a disbursement plan
 */
export interface ExecuteDisbursementPlanResponseDto {
  success: boolean;
  processedItems: number;
  totalDisbursed?: number;
  totalRequested?: number;
}
