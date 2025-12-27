import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';

export class GetLoansQueryHandler {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(): Promise<LoanResponseDto[]> {
    const loans = await this.loanRepository.findAll();
    return loans.map((loan) => ({
      id: loan.id,
      memberId: loan.memberId,
      loanType: loan.loanType,
      approvedAmount: loan.approvedAmount,
      disbursedAmount: loan.disbursedAmount,
      outstandingBalance: loan.outstandingBalance,
      monthlyPaymentAmount: loan.monthlyPaymentAmount,
      interestRate: loan.interestRate,
      term: loan.term,
      status: loan.status,
      creationDate: loan.creationDate,
      guaranteedStockId: loan.guaranteedStockId,
    }));
  }
}
