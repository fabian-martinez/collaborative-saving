/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { LoanType } from '@domain/entities/loan-type.entity';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { CreateLoanTypeDto } from '@application/dto/settings/create-loan-type.dto';
import { LoanTypeResponseDto } from '@application/dto/settings/loan-type-response.dto';

export class CreateLoanTypeUseCase {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(dto: CreateLoanTypeDto): Promise<LoanTypeResponseDto> {
    const loanType = LoanType.create(dto);

    const existing = await this.loanTypeRepository.findByCode(loanType.code);
    if (existing) {
      throw new Error(
        `A loan type with code '${loanType.code}' already exists`,
      );
    }

    const saved = await this.loanTypeRepository.save(loanType);

    return this.toDto(saved);
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
