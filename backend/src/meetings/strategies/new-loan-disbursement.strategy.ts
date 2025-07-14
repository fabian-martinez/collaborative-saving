import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { LoansService } from '../../loans/loans.service';
import { DisbursementPlanItemDto } from '../dto/disbursement-plan.dto';

@Injectable()
export class NewLoanDisbursementStrategy implements DisbursementStrategy {
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
    if (!item.newLoanRequest) return;
    const createLoanDto = {
      member_id: item.newLoanRequest.memberId,
      meeting_id: meetingId,
      loan_type: item.newLoanRequest.loanType,
      approved_amount: item.newLoanRequest.amount,
      monthly_payment_amount: item.newLoanRequest.monthlyPaymentAmount,
      interest_rate: item.newLoanRequest.interestRate,
      status: 'active',
    };
    await this.loansService.create(createLoanDto, queryRunner);
  }
}
