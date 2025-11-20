import { DisbursementStockRequestDto } from './disbursement-stock-request.dto';
import { NewLoanRequestDto } from './new-loan-request.dto';

/**
 * Disbursement Type Enum
 */
export enum DisbursementType {
  DIVIDEND = 'dividend',
  WITHDRAWAL = 'withdrawal',
  LOAN = 'loan',
  OTHER = 'other',
}

/**
 * Disbursement Plan Item DTO
 *
 * Represents a single item in a disbursement plan
 */
export interface DisbursementPlanItemDto {
  memberId: string;
  type: DisbursementType;
  amount: number;
  status?: string;
  notes?: string;
  loanId?: string;
  stockSubscriptionId?: string;
  pendingMemberPaymentId?: string;
  disbursementStockRequest?: DisbursementStockRequestDto;
  newLoanRequest?: NewLoanRequestDto;
}
