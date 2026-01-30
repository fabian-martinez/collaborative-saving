import { UpdateInterestDistributionConfigUseCase, UpdateInterestDistributionConfigCommand } from './update-interest-distribution-config.use-case';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';
import { NotFoundException } from '@nestjs/common';

describe('UpdateInterestDistributionConfigUseCase', () => {
  let useCase: UpdateInterestDistributionConfigUseCase;
  let configRepository: jest.Mocked<InterestDistributionConfigRepository>;

  beforeEach(() => {
    configRepository = {
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InterestDistributionConfigRepository>;

    useCase = new UpdateInterestDistributionConfigUseCase(configRepository);
  });

  it('should update and save an existing interest distribution config', async () => {
    const existingConfig = InterestDistributionConfig.create({
      id: 'config-1',
      loanTypeId: 'loan-1',
      stockTypeId: 'stock-1',
    });

    const command: UpdateInterestDistributionConfigCommand = {
      id: 'config-1',
      loanTypeId: 'loan-2',
    };

    configRepository.findAll.mockResolvedValue([existingConfig]);
    configRepository.save.mockImplementation((c) => Promise.resolve(c));

    const result = await useCase.execute(command);

    expect(configRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'config-1',
        loanTypeId: 'loan-2',
        stockTypeId: 'stock-1',
      })
    );
    expect(result.loanTypeId).toBe('loan-2');
  });

  it('should throw NotFoundException if config does not exist', async () => {
    configRepository.findAll.mockResolvedValue([]);

    const command: UpdateInterestDistributionConfigCommand = {
      id: 'non-existent',
      loanTypeId: 'loan-2',
    };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
  });
});
