import { GetInterestDistributionConfigsQueryHandler } from './get-interest-distribution-configs.query-handler';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';

describe('GetInterestDistributionConfigsQueryHandler', () => {
  let queryHandler: GetInterestDistributionConfigsQueryHandler;
  let configRepository: jest.Mocked<InterestDistributionConfigRepository>;

  beforeEach(() => {
    configRepository = {
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InterestDistributionConfigRepository>;

    queryHandler = new GetInterestDistributionConfigsQueryHandler(configRepository);
  });

  it('should return all interest distribution configs from repository', async () => {
    const configs: InterestDistributionConfig[] = [
      InterestDistributionConfig.create({ id: '1', loanTypeId: 'loan-1', stockTypeId: 'stock-1' }),
      InterestDistributionConfig.create({ id: '2', loanTypeId: 'loan-2', stockTypeId: 'stock-2' }),
    ];

    configRepository.findAll.mockResolvedValue(configs);

    const result = await queryHandler.execute();

    expect(configRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(configs);
  });

  it('should return empty array when no configs exist', async () => {
    configRepository.findAll.mockResolvedValue([]);

    const result = await queryHandler.execute();

    expect(configRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
