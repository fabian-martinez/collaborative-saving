import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';

export class DeleteLoanTypeUseCase {
  constructor(private readonly loanTypeRepo: LoanTypeRepository) {}

  async execute(id: string): Promise<void> {
    await this.loanTypeRepo.delete(id);
  }
}
