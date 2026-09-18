import { DomainEvent } from './domain-event.base';

export interface LoanTermsChangedPayload {
  loanId: string;
  memberId: string;
  previousTerms: {
    interestRate: number;
    monthlyPaymentAmount: number;
    term: number;
    loanType?: string;
  };
  newTerms: {
    interestRate: number;
    monthlyPaymentAmount: number;
    term: number;
    loanType?: string;
  };
  changedBy?: string; // User ID who made the change
}

export class LoanTermsChangedEvent extends DomainEvent<LoanTermsChangedPayload> {
  constructor(payload: LoanTermsChangedPayload) {
    super('loan.terms.changed', payload);
  }
}
