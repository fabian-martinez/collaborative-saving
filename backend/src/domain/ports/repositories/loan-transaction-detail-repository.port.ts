import { LoanTransactionDetail } from '../../entities/loan-transaction-detail.entity';
import {
  PaginationOptions,
  PaginatedResult,
} from './operation-repository.port';

export interface LoanTransactionDetailRepository {
  findById(id: string): Promise<LoanTransactionDetail | null>;
  findByLoan(loanId: string): Promise<LoanTransactionDetail[]>;
  findByLoanWithPagination(
    loanId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<LoanTransactionDetail>>;
  findByLoans(loanIds: string[]): Promise<LoanTransactionDetail[]>;
  findByLoanAndMeeting(
    loanId: string,
    meetingId: string,
  ): Promise<LoanTransactionDetail[]>;
  findByLoansAndMeeting(
    loanIds: string[],
    meetingId: string,
  ): Promise<LoanTransactionDetail[]>;
  findByOperationIds(operationIds: string[]): Promise<LoanTransactionDetail[]>;
  save(transaction: LoanTransactionDetail): Promise<LoanTransactionDetail>;
  saveMany(
    transactions: LoanTransactionDetail[],
  ): Promise<LoanTransactionDetail[]>;
}
