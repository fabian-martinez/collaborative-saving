/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanType } from '../../entities/loan-type.entity';

export interface LoanTypeRepository {
  findById(id: string): Promise<LoanType | null>;
  findByCode(code: string): Promise<LoanType | null>;
  findAll(): Promise<LoanType[]>;
  save(loanType: LoanType): Promise<LoanType>;
  softDelete(id: string): Promise<void>;
}
