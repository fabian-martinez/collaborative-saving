import { Injectable } from '@nestjs/common';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import {
  GetPortfolioStatusResponseDto,
  PortfolioByLoanTypeDto,
} from '@application/dto/dashboard/portfolio-status-response.dto';
import { LoanStatus } from '@domain/enums/loan-status.enum';

@Injectable()
export class GetPortfolioStatusQueryHandler {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly loanTypeRepository?: LoanTypeRepository,
  ) {}

  async execute(): Promise<GetPortfolioStatusResponseDto> {
    const [allLoans, loanTypes] = await Promise.all([
      this.loanRepository.findAll(),
      this.loanTypeRepository
        ? this.loanTypeRepository.findAll()
        : Promise.resolve([]),
    ]);

    const writtenOff = allLoans.filter(
      (loan) => (loan.status as LoanStatus) === LoanStatus.DEFAULTED,
    ).length;

    const activeLoans = allLoans.filter(
      (loan) => (loan.status as LoanStatus) === LoanStatus.ACTIVE,
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

    const loanTypeNameMap = new Map<string, string>(
      loanTypes.map((lt) => [lt.code, lt.name]),
    );

    const groupedByType = new Map<string, PortfolioByLoanTypeDto>();
    for (const loan of activeLoans) {
      const code = loan.loanType || 'otro';
      const existing = groupedByType.get(code);
      const displayName =
        loanTypeNameMap.get(code) ||
        code.charAt(0).toUpperCase() + code.slice(1);

      if (existing) {
        existing.count += 1;
        existing.totalAmount += loan.outstandingBalance;
      } else {
        groupedByType.set(code, {
          loanType: code,
          name: displayName,
          count: 1,
          totalAmount: loan.outstandingBalance,
        });
      }
    }

    return {
      upToDate,
      overdue,
      writtenOff,
      byType: Array.from(groupedByType.values()),
    };
  }
}
