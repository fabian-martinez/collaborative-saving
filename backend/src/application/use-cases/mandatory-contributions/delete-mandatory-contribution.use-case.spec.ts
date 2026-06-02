import { DeleteMandatoryContributionUseCase } from './delete-mandatory-contribution.use-case';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';

describe('DeleteMandatoryContributionUseCase', () => {
  let useCase: DeleteMandatoryContributionUseCase;
  let repository: jest.Mocked<MandatoryContributionRepository>;
  let findByIdSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByAssetType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    findByIdSpy = jest.spyOn(repository, 'findById');
    deleteSpy = jest.spyOn(repository, 'delete');

    useCase = new DeleteMandatoryContributionUseCase(repository);
  });

  it('should delete a mandatory contribution successfully', async () => {
    const existingContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    const deleteDto = { id: existingContribution.id };

    repository.findById.mockResolvedValue(existingContribution);
    repository.delete.mockResolvedValue();

    await useCase.execute(deleteDto);

    expect(findByIdSpy).toHaveBeenCalledWith(existingContribution.id);
    expect(deleteSpy).toHaveBeenCalledWith(existingContribution.id);
  });

  it('should throw error if contribution not found', async () => {
    const deleteDto = { id: 'non-existent-id' };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(deleteDto)).rejects.toThrow(
      'Mandatory contribution not found',
    );

    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
