import { GetMandatoryContributionsQueryHandler } from './get-mandatory-contributions.query-handler';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';

describe('GetMandatoryContributionsQueryHandler', () => {
  let queryHandler: GetMandatoryContributionsQueryHandler;
  let repository: jest.Mocked<MandatoryContributionRepository>;
  let findAllSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByAssetType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    findAllSpy = jest.spyOn(repository, 'findAll');

    queryHandler = new GetMandatoryContributionsQueryHandler(repository);
  });

  it('should return all mandatory contributions', async () => {
    const contributions = [
      MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      }),
      MandatoryContribution.create({
        assetType: 'savings',
        value: 50,
      }),
    ];

    repository.findAll.mockResolvedValue(contributions);

    const result = await queryHandler.execute();

    expect(findAllSpy).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: contributions[0].id,
      assetType: contributions[0].assetType,
      value: contributions[0].value,
    });
    expect(result[1]).toEqual({
      id: contributions[1].id,
      assetType: contributions[1].assetType,
      value: contributions[1].value,
    });
  });

  it('should return empty array when no contributions exist', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await queryHandler.execute();

    expect(findAllSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
