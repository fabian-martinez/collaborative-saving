import { NotFoundException } from '@nestjs/common';
import { LoanType, AmortizationType } from '@domain/entities/loan-type.entity';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';

export interface UpdateLoanTypeCommand {
  id: string;
  name?: string;
  defaultApprovedAmount?: number;
  defaultInterestRate?: number;
  defaultTerm?: number;
  amortizationType?: AmortizationType;
}

export class UpdateLoanTypeUseCase {
  constructor(private readonly loanTypeRepo: LoanTypeRepository) {}

  async execute(command: UpdateLoanTypeCommand): Promise<LoanType> {
    const existing = await this.loanTypeRepo.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`LoanType with ID ${command.id} not found`);
    }

    const updated = LoanType.create({
      id: existing.id,
      name: command.name ?? existing.name,
      defaultApprovedAmount: command.defaultApprovedAmount ?? existing.defaultApprovedAmount,
      defaultInterestRate: command.defaultInterestRate ?? existing.defaultInterestRate,
      defaultTerm: command.defaultTerm ?? existing.defaultTerm,
      amortizationType: command.amortizationType ?? existing.amortizationType,
    });

    return this.loanTypeRepo.save(updated);
  }
}
