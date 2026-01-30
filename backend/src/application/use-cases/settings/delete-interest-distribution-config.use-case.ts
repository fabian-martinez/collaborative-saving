import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';

export class DeleteInterestDistributionConfigUseCase {
  constructor(private readonly configRepo: InterestDistributionConfigRepository) {}

  async execute(id: string): Promise<void> {
    await this.configRepo.delete(id);
  }
}
