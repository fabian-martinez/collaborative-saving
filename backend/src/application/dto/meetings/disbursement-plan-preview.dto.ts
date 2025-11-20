import { DisbursementPlanItemDto } from './disbursement-plan-item.dto';

/**
 * Disbursement Plan Preview DTO
 *
 * Preview of pending disbursements for a meeting
 */
export interface DisbursementPlanPreviewDto {
  plan: DisbursementPlanItemDto[];
  availableCash: number;
  totalToDisburse: number;
}
