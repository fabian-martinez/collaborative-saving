import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';
import { randomUUID } from 'crypto';

export interface CreateInterestDistributionConfigCommand {
  loanTypeId: string;
  stockTypeId: string;
}

export class CreateInterestDistributionConfigUseCase {
  constructor(private readonly configRepo: InterestDistributionConfigRepository) {}

  async execute(command: CreateInterestDistributionConfigCommand): Promise<InterestDistributionConfig> {
    const config = InterestDistributionConfig.create({
      id: randomUUID(),
      loanTypeId: command.loanTypeId,
      stockTypeId: command.stockTypeId,
    });
    return this.configRepo.save(config);
  }
}
