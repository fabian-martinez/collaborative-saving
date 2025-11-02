import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContributionResponseDto } from '@application/dto/mandatory-contributions/mandatory-contribution-response.dto';

export class GetMandatoryContributionsQueryHandler {
  constructor(
    private readonly mandatoryContributionRepository: MandatoryContributionRepository,
  ) {}

  async execute(): Promise<MandatoryContributionResponseDto[]> {
    const contributions = await this.mandatoryContributionRepository.findAll();
    return contributions.map((c) => ({
      id: c.id,
      assetType: c.assetType,
      value: c.value,
    }));
  }
}
