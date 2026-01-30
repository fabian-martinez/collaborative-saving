import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';
import { InterestDistributionConfig as InterestDistributionConfigEntity } from '../entities/interest-distribution-config.entity';

export class InterestDistributionConfigMapper {
  static toDomain(persistence: InterestDistributionConfigEntity): InterestDistributionConfig {
    return InterestDistributionConfig.create({
      id: persistence.id,
      loanTypeId: persistence.loanTypeId,
      stockTypeId: persistence.stockTypeId,
    });
  }

  static toPersistence(domain: InterestDistributionConfig): Partial<InterestDistributionConfigEntity> {
    return {
      id: domain.id,
      loanTypeId: domain.loanTypeId,
      stockTypeId: domain.stockTypeId,
    };
  }
}
