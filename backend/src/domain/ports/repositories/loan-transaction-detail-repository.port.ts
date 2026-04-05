import { LoanTransactionDetail } from '../../entities/loan-transaction-detail.entity';

export interface LoanTransactionDetailRepository {
  findById(id: string): Promise<LoanTransactionDetail | null>;
  findByLoan(loanId: string): Promise<LoanTransactionDetail[]>;
  findByLoanAndMeeting(
    loanId: string,
    meetingId: string,
  ): Promise<LoanTransactionDetail[]>;
  findByLoansAndMeeting(
    loanIds: string[],
    meetingId: string,
  ): Promise<LoanTransactionDetail[]>;
  save(transaction: LoanTransactionDetail): Promise<LoanTransactionDetail>;
  saveMany(
    transactions: LoanTransactionDetail[],
  ): Promise<LoanTransactionDetail[]>;
}
