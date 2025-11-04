export enum MemberDueType {
  MANDATORY_CONTRIBUTION = 'mandatory_contribution',
  STOCK_FEE = 'stock_fee',
  LOAN_PAYMENT = 'loan_payment',
  FEE = 'fee',
  INSURANCE = 'insurance',
  NOVELTY = 'novelty',
}

export class MemberDueDetailsDto {
  interest: number;
  principal: number;
  outstanding_balance: number;
}

export class MemberDueResponseDto {
  type: MemberDueType;
  description: string;
  amount: number;
  referenceId?: string;
  details?: MemberDueDetailsDto;
  monthlyContribution?: number;
  stockQuantity?: number;
  noveltyComment?: string;
  creationDate?: string;
}
