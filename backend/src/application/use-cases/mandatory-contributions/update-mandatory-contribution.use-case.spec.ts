import { UpdateMandatoryContributionUseCase } from './update-mandatory-contribution.use-case';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';

describe('UpdateMandatoryContributionUseCase', () => {
  let useCase: UpdateMandatoryContributionUseCase;
  let repository: jest.Mocked<MandatoryContributionRepository>;
  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByAssetType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MandatoryContributionRepository>;

    findByIdSpy = jest.spyOn(repository, 'findById');
    saveSpy = jest.spyOn(repository, 'save');

    useCase = new UpdateMandatoryContributionUseCase(repository);
  });

  it('should update a mandatory contribution successfully', async () => {
    const existingContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    const updateDto = {
      id: existingContribution.id,
      assetType: 'savings',
      value: 200,
    };

    repository.findById.mockResolvedValue(existingContribution);
    repository.findByAssetType.mockResolvedValue(null);
    repository.save.mockResolvedValue(existingContribution);

    const result = await useCase.execute(updateDto);

    expect(findByIdSpy).toHaveBeenCalledWith(existingContribution.id);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(existingContribution.id);
  });

  it('should throw error if contribution not found', async () => {
    const updateDto = {
      id: 'non-existent-id',
      assetType: 'savings',
      value: 200,
    };

    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(updateDto)).rejects.toThrow(
      'Mandatory contribution not found',
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should update only assetType', async () => {
    const existingContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    const updateDto = {
      id: existingContribution.id,
      assetType: 'savings',
    };

    repository.findById.mockResolvedValue(existingContribution);
    repository.findByAssetType.mockResolvedValue(null);
    repository.save.mockResolvedValue(existingContribution);

    await useCase.execute(updateDto);

    expect(findByIdSpy).toHaveBeenCalledWith(existingContribution.id);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should update only value', async () => {
    const existingContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    const updateDto = {
      id: existingContribution.id,
      value: 200,
    };

    repository.findById.mockResolvedValue(existingContribution);
    repository.save.mockResolvedValue(existingContribution);

    await useCase.execute(updateDto);

    expect(findByIdSpy).toHaveBeenCalledWith(existingContribution.id);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw error if new assetType already exists in another contribution', async () => {
    const existingContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    const otherContribution = MandatoryContribution.create({
      assetType: 'savings',
      value: 50,
    });

    const updateDto = {
      id: existingContribution.id,
      assetType: 'savings',
      value: 200,
    };

    repository.findById.mockResolvedValue(existingContribution);
    repository.findByAssetType.mockResolvedValue(otherContribution);

    await expect(useCase.execute(updateDto)).rejects.toThrow(
      'A mandatory contribution with this asset type already exists',
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should throw error when updating to value <= 0', async () => {
    const existingContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    const updateDto = {
      id: existingContribution.id,
      value: 0,
    };

    repository.findById.mockResolvedValue(existingContribution);

    await expect(useCase.execute(updateDto)).rejects.toThrow(
      'Value must be greater than 0',
    );
  });
});
