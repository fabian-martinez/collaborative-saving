import { PaymentType } from '../../../domain/enums/payment-type.enum';

// Re-export PaymentType as MemberDueType for backward compatibility
export type MemberDueType = PaymentType;

export class MemberDueDetailsDto {
  interest: number;
  principal: number;
  outstanding_balance: number;
}

export class MemberDueResponseDto {
  type: PaymentType;
  description: string;
  amount: number;
  referenceId?: string;
  details?: MemberDueDetailsDto;
  monthlyContribution?: number;
  stockQuantity?: number;
  noveltyComment?: string;
  creationDate?: string;
}
