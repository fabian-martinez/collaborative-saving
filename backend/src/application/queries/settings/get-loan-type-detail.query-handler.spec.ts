/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetLoanTypeDetailQueryHandler } from './get-loan-type-detail.query-handler';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType } from '@domain/entities/loan-type.entity';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

describe('GetLoanTypeDetailQueryHandler', () => {
  let queryHandler: GetLoanTypeDetailQueryHandler;
  let mockLoanTypeRepo: jest.Mocked<LoanTypeRepository>;

  beforeEach(() => {
    mockLoanTypeRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    queryHandler = new GetLoanTypeDetailQueryHandler(mockLoanTypeRepo);
  });

  it('should return loan type detail mapped to DTO', async () => {
    // ARRANGE
    const lt = LoanType.create({ name: 'Corriente', interestRate: 0.015 });
    mockLoanTypeRepo.findById.mockResolvedValue(lt);

    // ACT
    const result = await queryHandler.execute(lt.id);

    // ASSERT
    expect(result).toBeDefined();
    expect(result.id).toBe(lt.id);
    expect(result.code).toBe('corriente');
    expect(result.interestRate).toBe(0.015);
  });

  it('should throw LoanTypeNotFoundException if loan type not found', async () => {
    // ARRANGE
    mockLoanTypeRepo.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(queryHandler.execute('non-existent')).rejects.toThrow(
      LoanTypeNotFoundException,
    );
  });
});
