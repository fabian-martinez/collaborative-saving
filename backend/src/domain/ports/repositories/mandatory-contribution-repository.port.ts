import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';

export interface MandatoryContributionRepository {
  findById(id: string): Promise<MandatoryContribution | null>;
  findByAssetType(assetType: string): Promise<MandatoryContribution | null>;
  findAll(): Promise<MandatoryContribution[]>;
  save(contribution: MandatoryContribution): Promise<MandatoryContribution>;
  delete(id: string): Promise<void>;
}
