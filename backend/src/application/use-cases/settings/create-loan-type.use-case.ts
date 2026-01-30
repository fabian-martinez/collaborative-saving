import { randomUUID } from 'crypto';
import { LoanType, AmortizationType } from '@domain/entities/loan-type.entity';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';

export interface CreateLoanTypeCommand {
  name: string;
  defaultApprovedAmount: number;
  defaultInterestRate: number;
  defaultTerm: number;
  amortizationType: AmortizationType;
}

export class CreateLoanTypeUseCase {
  constructor(private readonly loanTypeRepo: LoanTypeRepository) {}

  async execute(command: CreateLoanTypeCommand): Promise<LoanType> {
    const loanType = LoanType.create({
      id: randomUUID(),
      name: command.name,
      defaultApprovedAmount: command.defaultApprovedAmount,
      defaultInterestRate: command.defaultInterestRate,
      defaultTerm: command.defaultTerm,
      amortizationType: command.amortizationType,
    });
    return this.loanTypeRepo.save(loanType);
  }
}
