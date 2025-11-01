import { UpdateMandatoryContributionDto } from '@application/dto/mandatory-contributions/update-mandatory-contribution.dto';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContributionResponseDto } from '@application/dto/mandatory-contributions/mandatory-contribution-response.dto';
import { AssetType } from '@domain/value-objects/asset-type.value-object';

export class UpdateMandatoryContributionUseCase {
  constructor(
    private readonly mandatoryContributionRepository: MandatoryContributionRepository,
  ) {}

  async execute(
    dto: UpdateMandatoryContributionDto,
  ): Promise<MandatoryContributionResponseDto> {
    const contribution = await this.mandatoryContributionRepository.findById(
      dto.id,
    );
    if (!contribution) {
      throw new Error('Mandatory contribution not found');
    }

    // Check if changing assetType and it already exists in another contribution
    if (dto.assetType && dto.assetType !== contribution.assetType) {
      const normalizedAssetType = AssetType.create(dto.assetType);
      const existing =
        await this.mandatoryContributionRepository.findByAssetType(
          normalizedAssetType.value,
        );
      if (existing && existing.id !== contribution.id) {
        throw new Error(
          'A mandatory contribution with this asset type already exists',
        );
      }
    }

    contribution.update({
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
