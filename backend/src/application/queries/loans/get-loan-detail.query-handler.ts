import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';

export class GetLoanDetailQueryHandler {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(loanId: string): Promise<LoanResponseDto> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new LoanNotFoundException(loanId);
    }
    return {
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
    };
  }
}

