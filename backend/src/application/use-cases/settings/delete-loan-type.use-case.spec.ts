/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { DeleteLoanTypeUseCase } from './delete-loan-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanType } from '@domain/entities/loan-type.entity';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

describe('DeleteLoanTypeUseCase', () => {
  let useCase: DeleteLoanTypeUseCase;
  let mockLoanTypeRepo: jest.Mocked<LoanTypeRepository>;
  let mockLoanRepo: jest.Mocked<Required<LoanRepository>>;
  let findByIdSpy: jest.SpyInstance;
  let softDeleteSpy: jest.SpyInstance;
  let hasActiveLoansByTypeSpy: jest.SpyInstance;

  beforeEach(() => {
    mockLoanTypeRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    mockLoanRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMember: jest.fn(),
      findActiveByMember: jest.fn(),
      findPendingByMember: jest.fn(),
      save: jest.fn(),
      findByIds: jest.fn(),
      hasActiveLoansByType: jest.fn(),
    };
    findByIdSpy = jest.spyOn(mockLoanTypeRepo, 'findById');
    softDeleteSpy = jest.spyOn(mockLoanTypeRepo, 'softDelete');
    hasActiveLoansByTypeSpy = jest.spyOn(mockLoanRepo, 'hasActiveLoansByType');

    useCase = new DeleteLoanTypeUseCase(mockLoanTypeRepo, mockLoanRepo);
  });

  it('should soft delete loan type when no active loans are associated', async () => {
    // ARRANGE
    const loanType = LoanType.create({
      name: 'Especial',
      code: 'especial',
      interestRate: 0.02,
    });
    mockLoanTypeRepo.findById.mockResolvedValue(loanType);
    mockLoanRepo.hasActiveLoansByType.mockResolvedValue(false);
    mockLoanTypeRepo.softDelete.mockResolvedValue();

    // ACT
    await useCase.execute(loanType.id);

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(loanType.id);
    expect(hasActiveLoansByTypeSpy).toHaveBeenCalledWith('especial');
    expect(softDeleteSpy).toHaveBeenCalledWith(loanType.id);
  });

  it('should throw LoanTypeNotFoundException if loan type is not found', async () => {
    // ARRANGE
    mockLoanTypeRepo.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(useCase.execute('invalid-id')).rejects.toThrow(
      LoanTypeNotFoundException,
    );
    expect(hasActiveLoansByTypeSpy).not.toHaveBeenCalled();
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });

  it('should throw error and NOT delete when there are active loans associated', async () => {
    // ARRANGE
    const loanType = LoanType.create({
      name: 'Corriente',
      code: 'corriente',
      interestRate: 0.015,
    });
    mockLoanTypeRepo.findById.mockResolvedValue(loanType);
    mockLoanRepo.hasActiveLoansByType.mockResolvedValue(true);

    // ACT & ASSERT
    await expect(useCase.execute(loanType.id)).rejects.toThrow(
      "Cannot delete loan type 'Corriente' because it has active loans associated",
    );
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });
});
