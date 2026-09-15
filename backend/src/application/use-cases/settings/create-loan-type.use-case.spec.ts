/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { CreateLoanTypeUseCase } from './create-loan-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType } from '@domain/entities/loan-type.entity';

describe('CreateLoanTypeUseCase', () => {
  let useCase: CreateLoanTypeUseCase;
  let mockLoanTypeRepo: jest.Mocked<LoanTypeRepository>;
  let findByCodeSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    mockLoanTypeRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    findByCodeSpy = jest.spyOn(mockLoanTypeRepo, 'findByCode');
    saveSpy = jest.spyOn(mockLoanTypeRepo, 'save');
    useCase = new CreateLoanTypeUseCase(mockLoanTypeRepo);
  });

  it('should create and save a new loan type successfully', async () => {
    // ARRANGE
    const dto = {
      name: 'Préstamo Corriente',
      code: 'corriente',
      interestRate: 0.015,
      description: 'Préstamo corriente',
    };
    mockLoanTypeRepo.findByCode.mockResolvedValue(null);
    mockLoanTypeRepo.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.code).toBe('corriente');
    expect(result.name).toBe('Préstamo Corriente');
    expect(result.interestRate).toBe(0.015);
    expect(result.description).toBe('Préstamo corriente');
    expect(findByCodeSpy).toHaveBeenCalledWith('corriente');
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if a loan type with the same code already exists', async () => {
    // ARRANGE
    const dto = {
      name: 'Corriente',
      code: 'corriente',
      interestRate: 0.015,
    };
    const existing = LoanType.create(dto);
    mockLoanTypeRepo.findByCode.mockResolvedValue(existing);

    // ACT & ASSERT
    await expect(useCase.execute(dto)).rejects.toThrow(
      "A loan type with code 'corriente' already exists",
    );
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
