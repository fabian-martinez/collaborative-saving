import { Loan } from '../../entities/loan.entity';

export interface LoanRepository {
  findById(id: string): Promise<Loan | null>;
  findAll(): Promise<Loan[]>;
  findByMember(memberId: string): Promise<Loan[]>;
  findActiveByMember(memberId: string): Promise<Loan[]>;
  findPendingByMember(memberId: string): Promise<Loan[]>;
  save(loan: Loan): Promise<Loan>;
  findByIds(ids: string[]): Promise<Loan[]>;
  countByLoanType(loanTypeId: string): Promise<number>;
}
