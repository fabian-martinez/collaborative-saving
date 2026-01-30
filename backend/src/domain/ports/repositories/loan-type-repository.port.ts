import { LoanType } from '../../entities/loan-type.entity';

export interface LoanTypeRepository {
  findAll(): Promise<LoanType[]>;
  findById(id: string): Promise<LoanType | null>;
  save(loanType: LoanType): Promise<LoanType>;
  delete(id: string): Promise<void>;
}
