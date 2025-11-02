import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';
import { MandatoryContribution as MandatoryContributionEntity } from '../entities/mandatory-contribution.entity';

export class MandatoryContributionMapper {
  static toDomain(
    persistence: MandatoryContributionEntity,
  ): MandatoryContribution {
    try {
      return MandatoryContribution.fromPersistence({
        id: persistence.id,
        assetType: persistence.assetType,
        value: persistence.value,
      });
    } catch (error) {
      throw new Error(
        `Failed to map MandatoryContribution to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(
    domain: MandatoryContribution,
  ): Partial<MandatoryContributionEntity> {
    return {
      id: domain.id,
      assetType: domain.assetType,
      value: domain.value,
    };
  }
}
