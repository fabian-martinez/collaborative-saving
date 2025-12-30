import { PaymentType } from '../../domain/enums/payment-type.enum';

export interface MemberDue {
  type: PaymentType;
  description: string;
  amount: number;
  referenceId?: string;
  details?: {
    interest: number;
    principal: number;
    outstanding_balance: number;
  };
  monthlyContribution?: number;
  stockQuantity?: number;
  noveltyComment?: string;
  creationDate?: string;
}
