import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';

export class GetInterestDistributionConfigsQueryHandler {
  constructor(private readonly configRepo: InterestDistributionConfigRepository) {}

  async execute(): Promise<InterestDistributionConfig[]> {
    return this.configRepo.findAll();
  }
}
