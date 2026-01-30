import { UpdateLoanTypeUseCase, UpdateLoanTypeCommand } from './update-loan-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType, AmortizationType } from '@domain/entities/loan-type.entity';
import { NotFoundException } from '@nestjs/common';

describe('UpdateLoanTypeUseCase', () => {
  let useCase: UpdateLoanTypeUseCase;
  let loanTypeRepository: jest.Mocked<LoanTypeRepository>;

  beforeEach(() => {
    loanTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<LoanTypeRepository>;

    useCase = new UpdateLoanTypeUseCase(loanTypeRepository);
  });

  it('should update and save an existing loan type', async () => {
    const existingLoanType = LoanType.create({
      id: 'loan-1',
      name: 'Original Name',
      defaultApprovedAmount: 1000,
      defaultInterestRate: 0.05,
      defaultTerm: 12,
      amortizationType: AmortizationType.FRENCH,
    });

    const command: UpdateLoanTypeCommand = {
      id: 'loan-1',
      name: 'Updated Name',
      defaultInterestRate: 0.04,
    };

    loanTypeRepository.findById.mockResolvedValue(existingLoanType);
    loanTypeRepository.save.mockImplementation((lt) => Promise.resolve(lt));

    const result = await useCase.execute(command);

    expect(loanTypeRepository.findById).toHaveBeenCalledWith('loan-1');
    expect(loanTypeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'loan-1',
        name: 'Updated Name',
        defaultInterestRate: 0.04,
        defaultApprovedAmount: 1000, // kept from existing
      })
    );
    expect(result.name).toBe('Updated Name');
    expect(result.defaultInterestRate).toBe(0.04);
  });

  it('should throw NotFoundException if loan type does not exist', async () => {
    loanTypeRepository.findById.mockResolvedValue(null);

    const command: UpdateLoanTypeCommand = {
      id: 'non-existent',
      name: 'Updated Name',
    };

    await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
  });
});
