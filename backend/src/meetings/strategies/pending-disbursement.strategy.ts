import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { DisbursementPlanItemDto } from '../dto/disbursement-plan.dto';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class PendingDisbursementStrategy implements DisbursementStrategy {
  constructor(private readonly loansService: LoansService) {}

  async execute({
    queryRunner,
    meetingId,
    item,
  }: {
    queryRunner: import('typeorm').QueryRunner;
    meetingId: string;
    item: DisbursementPlanItemDto;
  }): Promise<void> {
    await this.loansService.processLoanDisbursement(
      queryRunner,
      meetingId,
      item,
    );
  }
}
