import { UpdateLoanTermsDto } from '@application/dto/loans/update-loan-terms.dto';
import { UpdateLoanTermsResponseDto } from '@application/dto/loans/update-loan-terms-response.dto';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { EventBus } from '@domain/ports/services/event-bus.port';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { LoanTermsChangedEvent } from '@domain/events/loan-terms-changed.event';

/**
 * Update Loan Terms Use Case
 *
 * Allows administrative updates to loan terms (interest rate, monthly payment, term).
 * Emits a LoanTermsChangedEvent for auditing purposes.
 */
export class UpdateLoanTermsUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: UpdateLoanTermsDto): Promise<UpdateLoanTermsResponseDto> {
    // 1. Load loan
    const loan = await this.loanRepository.findById(dto.loanId);
    if (!loan) {
      throw new LoanNotFoundException(dto.loanId);
    }

    // 2. Store previous values for event
    const previousTerms = {
      interestRate: loan.interestRate,
      monthlyPaymentAmount: loan.monthlyPaymentAmount,
      term: loan.term,
      loanType: loan.loanType,
    };

    // 3. Check if any terms are being updated
    const hasChanges =
      (dto.interestRate !== undefined &&
        dto.interestRate !== loan.interestRate) ||
      (dto.monthlyPaymentAmount !== undefined &&
        dto.monthlyPaymentAmount !== loan.monthlyPaymentAmount) ||
      (dto.term !== undefined && dto.term !== loan.term) ||
      (dto.loanType !== undefined && dto.loanType !== loan.loanType);

    if (!hasChanges) {
      // No changes, return current loan data
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

    // 4. Update loan entity terms
    loan.updateTerms({
      interestRate: dto.interestRate,
      monthlyPaymentAmount: dto.monthlyPaymentAmount,
      term: dto.term,
      loanType: dto.loanType,
    });

    // 5. Save updated loan
    const updatedLoan = await this.loanRepository.save(loan);

    // 6. Prepare new terms for event
    const newTerms = {
      interestRate: updatedLoan.interestRate,
      monthlyPaymentAmount: updatedLoan.monthlyPaymentAmount,
      term: updatedLoan.term,
      loanType: updatedLoan.loanType,
    };

    // 7. Emit domain event for auditing
    const event = new LoanTermsChangedEvent({
      loanId: updatedLoan.id,
      memberId: updatedLoan.memberId,
      previousTerms,
      newTerms,
      changedBy: dto.changedBy,
    });
    await this.eventBus.publish(event);

    // 8. Return response
    return {
      id: updatedLoan.id,
      memberId: updatedLoan.memberId,
      loanType: updatedLoan.loanType,
      approvedAmount: updatedLoan.approvedAmount,
      disbursedAmount: updatedLoan.disbursedAmount,
      outstandingBalance: updatedLoan.outstandingBalance,
      monthlyPaymentAmount: updatedLoan.monthlyPaymentAmount,
      interestRate: updatedLoan.interestRate,
      term: updatedLoan.term,
      status: updatedLoan.status,
      creationDate: updatedLoan.creationDate,
      guaranteedStockId: updatedLoan.guaranteedStockId,
    };
  }
}
