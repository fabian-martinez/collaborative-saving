import { DisbursementPlanItemDto } from './disbursement-plan-item.dto';

/**
 * Execute Disbursement Plan DTO
 *
 * Input DTO for executing a disbursement plan
 */
export interface ExecuteDisbursementPlanDto {
  meetingId: string;
  plan: DisbursementPlanItemDto[];
}
