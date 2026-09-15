/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { UpdateLoanTypeUseCase } from './update-loan-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType } from '@domain/entities/loan-type.entity';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

describe('UpdateLoanTypeUseCase', () => {
  let useCase: UpdateLoanTypeUseCase;
  let mockLoanTypeRepo: jest.Mocked<LoanTypeRepository>;
  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    mockLoanTypeRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    findByIdSpy = jest.spyOn(mockLoanTypeRepo, 'findById');
    saveSpy = jest.spyOn(mockLoanTypeRepo, 'save');
    useCase = new UpdateLoanTypeUseCase(mockLoanTypeRepo);
  });

  it('should update loan type successfully', async () => {
    // ARRANGE
    const loanType = LoanType.create({
      name: 'Viejo',
      interestRate: 0.015,
      description: 'Vieja desc',
    });
    mockLoanTypeRepo.findById.mockResolvedValue(loanType);
    mockLoanTypeRepo.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );

    // ACT
    const result = await useCase.execute(loanType.id, {
      name: 'Nuevo',
      interestRate: 0.02,
      description: 'Nueva desc',
    });

    // ASSERT
    expect(result.name).toBe('Nuevo');
    expect(result.interestRate).toBe(0.02);
    expect(result.description).toBe('Nueva desc');
    expect(findByIdSpy).toHaveBeenCalledWith(loanType.id);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw LoanTypeNotFoundException if loan type does not exist', async () => {
    // ARRANGE
    mockLoanTypeRepo.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(
      useCase.execute('non-existent-id', { name: 'Nuevo' }),
    ).rejects.toThrow(LoanTypeNotFoundException);
  });
});
