import { CreateMandatoryContributionDto } from '@application/dto/mandatory-contributions/create-mandatory-contribution.dto';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContributionResponseDto } from '@application/dto/mandatory-contributions/mandatory-contribution-response.dto';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';
import { AssetType } from '@domain/value-objects/asset-type.value-object';

export class CreateMandatoryContributionUseCase {
  constructor(
    private readonly mandatoryContributionRepository: MandatoryContributionRepository,
  ) {}

  async execute(
    dto: CreateMandatoryContributionDto,
  ): Promise<MandatoryContributionResponseDto> {
    // Normalize assetType to check uniqueness
    const normalizedAssetType = AssetType.create(dto.assetType);

    // Check if assetType already exists
    const existing = await this.mandatoryContributionRepository.findByAssetType(
      normalizedAssetType.value,
    );
    if (existing) {
      throw new Error(
        'A mandatory contribution with this asset type already exists',
      );
    }

    const contribution = MandatoryContribution.create({
      assetType: dto.assetType,
      value: dto.value,
    });

    const saved = await this.mandatoryContributionRepository.save(contribution);

    return {
      id: saved.id,
      assetType: saved.assetType,
      value: saved.value,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
