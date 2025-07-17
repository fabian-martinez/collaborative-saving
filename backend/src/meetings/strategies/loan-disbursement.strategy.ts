import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { LoansService } from '../../loans/loans.service';
import { DisbursementPlanItemDto } from '../dto/disbursement-plan.dto';

@Injectable()
export class LoanDisbursementStrategy implements DisbursementStrategy {
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
