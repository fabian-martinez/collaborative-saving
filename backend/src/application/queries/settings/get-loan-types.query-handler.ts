import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType } from '@domain/entities/loan-type.entity';

export class GetLoanTypesQueryHandler {
  constructor(private readonly loanTypeRepo: LoanTypeRepository) {}

  async execute(): Promise<LoanType[]> {
    return this.loanTypeRepo.findAll();
  }
}
