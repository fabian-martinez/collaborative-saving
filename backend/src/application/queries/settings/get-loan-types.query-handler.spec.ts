/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetLoanTypesQueryHandler } from './get-loan-types.query-handler';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType } from '@domain/entities/loan-type.entity';

describe('GetLoanTypesQueryHandler', () => {
  let queryHandler: GetLoanTypesQueryHandler;
  let mockLoanTypeRepo: jest.Mocked<LoanTypeRepository>;
  let findAllSpy: jest.SpyInstance;

  beforeEach(() => {
    mockLoanTypeRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    findAllSpy = jest.spyOn(mockLoanTypeRepo, 'findAll');
    queryHandler = new GetLoanTypesQueryHandler(mockLoanTypeRepo);
  });

  it('should return all loan types mapped to DTOs', async () => {
    // ARRANGE
    const lt1 = LoanType.create({ name: 'Corriente', interestRate: 0.015 });
    const lt2 = LoanType.create({ name: 'Ágil', interestRate: 0.02 });
    mockLoanTypeRepo.findAll.mockResolvedValue([lt1, lt2]);

    // ACT
    const result = await queryHandler.execute();

    // ASSERT
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe('corriente');
    expect(result[1].code).toBe('agil');
    expect(findAllSpy).toHaveBeenCalledTimes(1);
  });
});
