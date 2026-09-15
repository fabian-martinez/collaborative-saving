/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

export class DeleteLoanTypeUseCase {
  constructor(
    private readonly loanTypeRepository: LoanTypeRepository,
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const loanType = await this.loanTypeRepository.findById(id);
    if (!loanType) {
      throw new LoanTypeNotFoundException(id);
    }

    const hasActiveLoans = this.loanRepository.hasActiveLoansByType
      ? await this.loanRepository.hasActiveLoansByType(loanType.code)
      : false;
    if (hasActiveLoans) {
      throw new Error(
        `Cannot delete loan type '${loanType.name}' because it has active loans associated`,
      );
    }

    await this.loanTypeRepository.softDelete(id);
  }
}
