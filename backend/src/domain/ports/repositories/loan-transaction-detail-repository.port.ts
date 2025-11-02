import { LoanTransactionDetail } from '../../../loans/entities/loan-transaction-detail.entity';
import { TransactionType } from '../../../common/enums/transaction-type.enum';

export interface LoanTransactionDetailRepository {
  findById(id: string): Promise<LoanTransactionDetail | null>;
  findByLoan(loanId: string): Promise<LoanTransactionDetail[]>;
  findByLoanAndMeeting(
    loanId: string,
    meetingId: string,
  ): Promise<LoanTransactionDetail[]>;
  findByLoanAndTransactionType(
    loanId: string,
    transactionType: TransactionType,
    meetingId: string,
  ): Promise<boolean>;
  save(transaction: Partial<LoanTransactionDetail>): Promise<LoanTransactionDetail>;
  saveMany(
    transactions: Partial<LoanTransactionDetail>[],
  ): Promise<LoanTransactionDetail[]>;
}
