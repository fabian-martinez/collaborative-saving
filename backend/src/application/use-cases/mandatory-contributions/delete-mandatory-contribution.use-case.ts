import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';

export class DeleteMandatoryContributionUseCase {
  constructor(
    private readonly mandatoryContributionRepository: MandatoryContributionRepository,
  ) {}

  async execute(dto: { id: string }): Promise<void> {
    const contribution = await this.mandatoryContributionRepository.findById(
      dto.id,
    );
    if (!contribution) {
      throw new Error('Mandatory contribution not found');
    }

    await this.mandatoryContributionRepository.delete(dto.id);
  }
}
