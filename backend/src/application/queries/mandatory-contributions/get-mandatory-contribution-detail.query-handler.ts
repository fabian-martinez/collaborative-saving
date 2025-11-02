import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContributionResponseDto } from '@application/dto/mandatory-contributions/mandatory-contribution-response.dto';

export class GetMandatoryContributionDetailQueryHandler {
  constructor(
    private readonly mandatoryContributionRepository: MandatoryContributionRepository,
  ) {}

  async execute(id: string): Promise<MandatoryContributionResponseDto> {
    const contribution =
      await this.mandatoryContributionRepository.findById(id);
    if (!contribution) {
      throw new Error('Mandatory contribution not found');
    }

    return {
      id: contribution.id,
      assetType: contribution.assetType,
      value: contribution.value,
    };
  }
}
