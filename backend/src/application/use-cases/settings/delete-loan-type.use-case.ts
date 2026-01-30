import { ConflictException } from '@nestjs/common';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';

export class DeleteLoanTypeUseCase {
  constructor(
    private readonly loanTypeRepo: LoanTypeRepository,
    private readonly loanRepo: LoanRepository,
    private readonly configRepo: InterestDistributionConfigRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const loanCount = await this.loanRepo.countByLoanType(id);
    if (loanCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el tipo de préstamo porque está siendo utilizado por ${loanCount} préstamos existentes.`,
      );
    }

    const configs = await this.configRepo.findByLoanType(id);
    if (configs.length > 0) {
      throw new ConflictException(
        `No se puede eliminar el tipo de préstamo porque está configurado en una regla de distribución de intereses.`,
      );
    }

    await this.loanTypeRepo.delete(id);
  }
}
