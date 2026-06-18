import { DomainEvent } from './domain-event.base';

export interface LoanApprovedAmountChangedPayload {
  loanId: string;
  memberId: string;
  previousApprovedAmount: number;
  newApprovedAmount: number;
  changedBy?: string;
}

export class LoanApprovedAmountChangedEvent extends DomainEvent<LoanApprovedAmountChangedPayload> {
  constructor(payload: LoanApprovedAmountChangedPayload) {
    super('loan.approved-amount.changed', payload);
  }
}
