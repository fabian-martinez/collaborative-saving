import { NotFoundException } from '@nestjs/common';
import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';

export interface UpdateInterestDistributionConfigCommand {
  id: string;
  loanTypeId?: string;
  stockTypeId?: string;
}

export class UpdateInterestDistributionConfigUseCase {
  constructor(private readonly configRepo: InterestDistributionConfigRepository) {}

  async execute(command: UpdateInterestDistributionConfigCommand): Promise<InterestDistributionConfig> {
    const configs = await this.configRepo.findAll();
    const existing = configs.find(c => c.id === command.id);
    
    if (!existing) {
      throw new NotFoundException(`InterestDistributionConfig with ID ${command.id} not found`);
    }

    const updated = InterestDistributionConfig.create({
      id: existing.id,
      loanTypeId: command.loanTypeId ?? existing.loanTypeId,
      stockTypeId: command.stockTypeId ?? existing.stockTypeId,
    });

    return this.configRepo.save(updated);
  }
}
