import { DeleteInterestDistributionConfigUseCase } from './delete-interest-distribution-config.use-case';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';

describe('DeleteInterestDistributionConfigUseCase', () => {
  let useCase: DeleteInterestDistributionConfigUseCase;
  let configRepository: jest.Mocked<InterestDistributionConfigRepository>;

  beforeEach(() => {
    configRepository = {
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InterestDistributionConfigRepository>;

    useCase = new DeleteInterestDistributionConfigUseCase(configRepository);
  });

  it('should delete an interest distribution config by id', async () => {
    const configId = 'config-1';

    await useCase.execute(configId);

    expect(configRepository.delete).toHaveBeenCalledTimes(1);
    expect(configRepository.delete).toHaveBeenCalledWith(configId);
  });
});
