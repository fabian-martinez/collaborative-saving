import { Loan as LoanDomain } from '@domain/entities/loan.entity';
import { Loan as LoanEntity } from '../entities/loan.entity';

export class LoanMapper {
  static toDomain(persistence: LoanEntity): LoanDomain {
    try {
      return LoanDomain.fromPersistence({
        id: persistence.id,
        member_id: persistence.memberId,
        loan_type: persistence.loanType,
        approved_amount: persistence.approvedAmount,
        disbursed_amount: persistence.disbursedAmount,
        outstanding_balance: persistence.outstandingBalance,
        monthly_payment_amount: persistence.monthlyPaymentAmount,
        interest_rate: persistence.interestRate,
        term: persistence.term,
        status: persistence.status,
        creation_date: persistence.creationDate,
        guaranteed_stock_id: persistence.guaranteedStockId ?? null,
      });
    } catch (error) {
      throw new Error(
        `Failed to map Loan (ID: ${persistence.id}) to domain: ${error instanceof Error ? error.message : String(error)}. Loan data: approvedAmount=${persistence.approvedAmount}, disbursedAmount=${persistence.disbursedAmount}, outstandingBalance=${persistence.outstandingBalance}`,
      );
    }
  }

  static toPersistence(domain: LoanDomain): Partial<LoanEntity> {
    return {
      id: domain.id,
      memberId: domain.memberId,
      loanType: domain.loanType,
      approvedAmount: domain.approvedAmount,
      disbursedAmount: domain.disbursedAmount,
      outstandingBalance: domain.outstandingBalance,
      monthlyPaymentAmount: domain.monthlyPaymentAmount,
      interestRate: domain.interestRate,
      term: domain.term,
      status: domain.status,
      creationDate: domain.creationDate,
      guaranteedStockId: domain.guaranteedStockId ?? null,
    };
  }
}
