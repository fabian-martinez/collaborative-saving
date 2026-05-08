import { CreateMandatoryContributionUseCase } from './create-mandatory-contribution.use-case';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';

describe('CreateMandatoryContributionUseCase', () => {
  let useCase: CreateMandatoryContributionUseCase;
  let repository: jest.Mocked<MandatoryContributionRepository>;
  let findByAssetTypeSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByAssetType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    findByAssetTypeSpy = jest.spyOn(repository, 'findByAssetType');
    saveSpy = jest.spyOn(repository, 'save');

    useCase = new CreateMandatoryContributionUseCase(repository);
  });

  it('should create a mandatory contribution successfully', async () => {
    const createDto = {
      assetType: 'stock',
      value: 100,
    };

    const savedContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    repository.findByAssetType.mockResolvedValue(null);
    repository.save.mockResolvedValue(savedContribution);

    const result = await useCase.execute(createDto);

    expect(findByAssetTypeSpy).toHaveBeenCalledTimes(1);
    expect(findByAssetTypeSpy).toHaveBeenCalledWith('stock');
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: savedContribution.id,
      assetType: savedContribution.assetType,
      value: savedContribution.value,
    });
  });

  it('should throw error if assetType already exists', async () => {
    const createDto = {
      assetType: 'stock',
      value: 100,
    };

    const existingContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 50,
    });

    repository.findByAssetType.mockResolvedValue(existingContribution);

    await expect(useCase.execute(createDto)).rejects.toThrow(
      'A mandatory contribution with this asset type already exists',
    );

    expect(findByAssetTypeSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should throw error for value <= 0', async () => {
    const createDto = {
      assetType: 'stock',
      value: 0,
    };

    repository.findByAssetType.mockResolvedValue(null);

    await expect(useCase.execute(createDto)).rejects.toThrow(
      'Value must be greater than 0',
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should throw error for empty assetType', async () => {
    const createDto = {
      assetType: '',
      value: 100,
    };

    repository.findByAssetType.mockResolvedValue(null);

    await expect(useCase.execute(createDto)).rejects.toThrow(
      'Asset type cannot be empty',
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should create contribution with normalized assetType', async () => {
    const createDto = {
      assetType: '  STOCK  ',
      value: 100,
    };

    const savedContribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    repository.findByAssetType.mockResolvedValue(null);
    repository.save.mockResolvedValue(savedContribution);

    const result = await useCase.execute(createDto);

    expect(findByAssetTypeSpy).toHaveBeenCalledWith('stock');
    expect(result.assetType).toBe('stock');
  });
});
