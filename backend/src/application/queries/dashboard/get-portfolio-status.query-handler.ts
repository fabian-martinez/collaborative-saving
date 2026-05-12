import { Injectable } from '@nestjs/common';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { GetPortfolioStatusResponseDto } from '@application/dto/dashboard/portfolio-status-response.dto';
import { LoanStatus } from '@domain/enums/loan-status.enum';

@Injectable()
export class GetPortfolioStatusQueryHandler {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
  ) {}

  async execute(): Promise<GetPortfolioStatusResponseDto> {
    const allLoans = await this.loanRepository.findAll();

    const writtenOff = allLoans.filter(
      (loan) => loan.status === LoanStatus.DEFAULTED,
    ).length;

    const activeLoans = allLoans.filter(
      (loan) => loan.status === LoanStatus.ACTIVE,
    );

    // Get all pending payments of type LOAN_PAYMENT to identify overdue loans
    const pendingPayments =
      await this.pendingMemberPaymentRepository.findWithFilters({
        status: 'pending',
        type: 'LOAN_PAYMENT',
      });

    const overdueLoanIds = new Set(
      pendingPayments.map((p) => p.loanId).filter(Boolean),
    );

    const overdue = activeLoans.filter((loan) =>
      overdueLoanIds.has(loan.id),
    ).length;

    const upToDate = activeLoans.length - overdue;

    return {
      upToDate,
      overdue,
      writtenOff,
    };
  }
}
