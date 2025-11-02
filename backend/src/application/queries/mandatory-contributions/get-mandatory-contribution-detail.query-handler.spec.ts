import { GetMandatoryContributionDetailQueryHandler } from './get-mandatory-contribution-detail.query-handler';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';

describe('GetMandatoryContributionDetailQueryHandler', () => {
  let queryHandler: GetMandatoryContributionDetailQueryHandler;
  let repository: jest.Mocked<MandatoryContributionRepository>;
  let findByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByAssetType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MandatoryContributionRepository>;

    findByIdSpy = jest.spyOn(repository, 'findById');

    queryHandler = new GetMandatoryContributionDetailQueryHandler(repository);
  });

  it('should return contribution details if exists', async () => {
    const contribution = MandatoryContribution.create({
      assetType: 'stock',
      value: 100,
    });

    repository.findById.mockResolvedValue(contribution);

    const result = await queryHandler.execute(contribution.id);

    expect(findByIdSpy).toHaveBeenCalledWith(contribution.id);
    expect(result).toEqual({
      id: contribution.id,
      assetType: contribution.assetType,
      value: contribution.value,
    });
  });

  it('should throw error if contribution does not exist', async () => {
    const nonExistentId = 'non-existent-id';

    repository.findById.mockResolvedValue(null);

    await expect(queryHandler.execute(nonExistentId)).rejects.toThrow(
      'Mandatory contribution not found',
    );
  });
});
