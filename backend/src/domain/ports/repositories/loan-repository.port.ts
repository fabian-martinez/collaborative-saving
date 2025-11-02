import { Loan } from '../../../loans/entities/loan.entity';

export interface LoanRepository {
  findById(id: string): Promise<Loan | null>;
  findByMember(memberId: string): Promise<Loan[]>;
  findActiveByMember(memberId: string): Promise<Loan[]>;
  save(loan: Loan): Promise<Loan>;
  update(id: string, data: Partial<Loan>): Promise<void>;
}
