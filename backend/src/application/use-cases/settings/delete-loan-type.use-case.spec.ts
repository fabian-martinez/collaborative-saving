import { DeleteLoanTypeUseCase } from './delete-loan-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { ConflictException } from '@nestjs/common';

describe('DeleteLoanTypeUseCase', () => {
  let useCase: DeleteLoanTypeUseCase;
  let loanTypeRepository: jest.Mocked<LoanTypeRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let configRepository: jest.Mocked<InterestDistributionConfigRepository>;

  beforeEach(() => {
    loanTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<LoanTypeRepository>;

    loanRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
      countByLoanType: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    configRepository = {
      findAll: jest.fn(),
      findByLoanType: jest.fn(),
      findByStockType: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InterestDistributionConfigRepository>;

    useCase = new DeleteLoanTypeUseCase(loanTypeRepository, loanRepository, configRepository);
  });

  it('should delete a loan type by id if not in use', async () => {
    const id = 'loan-1';
    loanRepository.countByLoanType.mockResolvedValue(0);
    configRepository.findByLoanType.mockResolvedValue([]);
    loanTypeRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(id);

    expect(loanRepository.countByLoanType).toHaveBeenCalledWith(id);
    expect(configRepository.findByLoanType).toHaveBeenCalledWith(id);
    expect(loanTypeRepository.delete).toHaveBeenCalledWith(id);
  });

  it('should throw ConflictException if loan type is in use by loans', async () => {
    const id = 'loan-1';
    loanRepository.countByLoanType.mockResolvedValue(3);

    await expect(useCase.execute(id)).rejects.toThrow(ConflictException);
    expect(loanTypeRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if loan type is in use by config', async () => {
    const id = 'loan-1';
    loanRepository.countByLoanType.mockResolvedValue(0);
    configRepository.findByLoanType.mockResolvedValue([{ id: 'config-1' } as any]);

    await expect(useCase.execute(id)).rejects.toThrow(ConflictException);
    expect(loanTypeRepository.delete).not.toHaveBeenCalled();
  });
});
