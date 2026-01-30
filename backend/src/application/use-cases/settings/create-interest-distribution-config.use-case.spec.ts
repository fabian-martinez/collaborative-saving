import { CreateInterestDistributionConfigUseCase, CreateInterestDistributionConfigCommand } from './create-interest-distribution-config.use-case';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';

describe('CreateInterestDistributionConfigUseCase', () => {
  let useCase: CreateInterestDistributionConfigUseCase;
  let configRepository: jest.Mocked<InterestDistributionConfigRepository>;

  beforeEach(() => {
    configRepository = {
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InterestDistributionConfigRepository>;

    useCase = new CreateInterestDistributionConfigUseCase(configRepository);
  });

  it('should create and save a new interest distribution config', async () => {
    const command: CreateInterestDistributionConfigCommand = {
      loanTypeId: 'loan-1',
      stockTypeId: 'stock-1',
    };

    const savedConfig = InterestDistributionConfig.create({
      id: 'generated-uuid',
      loanTypeId: command.loanTypeId,
      stockTypeId: command.stockTypeId,
    });

    configRepository.save.mockResolvedValue(savedConfig);

    const result = await useCase.execute(command);

    expect(configRepository.save).toHaveBeenCalledTimes(1);
    expect(configRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        loanTypeId: command.loanTypeId,
        stockTypeId: command.stockTypeId,
      })
    );
    expect(result).toEqual(savedConfig);
  });
});
