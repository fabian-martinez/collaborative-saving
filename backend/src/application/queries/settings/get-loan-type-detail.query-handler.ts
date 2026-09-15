/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanTypeResponseDto } from '@application/dto/settings/loan-type-response.dto';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

export class GetLoanTypeDetailQueryHandler {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(id: string): Promise<LoanTypeResponseDto> {
    const loanType = await this.loanTypeRepository.findById(id);
    if (!loanType) {
      throw new LoanTypeNotFoundException(id);
    }

    return {
      id: loanType.id,
      code: loanType.code,
      name: loanType.name,
      interestRate: loanType.interestRate,
      description: loanType.description,
      createdAt: loanType.createdAt,
      updatedAt: loanType.updatedAt,
    };
  }
}
