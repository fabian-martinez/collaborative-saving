/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanTypeResponseDto } from '@application/dto/settings/loan-type-response.dto';

export class GetLoanTypesQueryHandler {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(): Promise<LoanTypeResponseDto[]> {
    const loanTypes = await this.loanTypeRepository.findAll();

    return loanTypes.map((loanType) => ({
      id: loanType.id,
      code: loanType.code,
      name: loanType.name,
      interestRate: loanType.interestRate,
      description: loanType.description,
      createdAt: loanType.createdAt,
      updatedAt: loanType.updatedAt,
    }));
  }
}
