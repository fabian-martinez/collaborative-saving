import { DisbursementPlanItemDto } from '../dto/disbursement-plan.dto';

export interface DisbursementStrategy {
  execute(params: {
    queryRunner: import('typeorm').QueryRunner;
    meetingId: string;
    item: DisbursementPlanItemDto;
  }): Promise<void>;
}
