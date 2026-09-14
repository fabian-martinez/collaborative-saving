/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanType } from '@domain/entities/loan-type.entity';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { UpdateLoanTypeDto } from '@application/dto/settings/update-loan-type.dto';
import { LoanTypeResponseDto } from '@application/dto/settings/loan-type-response.dto';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

export class UpdateLoanTypeUseCase {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(
    id: string,
    dto: UpdateLoanTypeDto,
  ): Promise<LoanTypeResponseDto> {
    const loanType = await this.loanTypeRepository.findById(id);
    if (!loanType) {
      throw new LoanTypeNotFoundException(id);
    }

    loanType.update(dto);

    const updated = await this.loanTypeRepository.save(loanType);

    return this.toDto(updated);
  }

  private toDto(loanType: LoanType): LoanTypeResponseDto {
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
