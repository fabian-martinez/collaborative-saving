/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanTypesV2Controller } from './loan-types.v2.controller';
import { CreateLoanTypeUseCase } from '@application/use-cases/settings/create-loan-type.use-case';
import { UpdateLoanTypeUseCase } from '@application/use-cases/settings/update-loan-type.use-case';
import { DeleteLoanTypeUseCase } from '@application/use-cases/settings/delete-loan-type.use-case';
import { GetLoanTypesQueryHandler } from '@application/queries/settings/get-loan-types.query-handler';
import { GetLoanTypeDetailQueryHandler } from '@application/queries/settings/get-loan-type-detail.query-handler';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

describe('LoanTypesV2Controller', () => {
  let controller: LoanTypesV2Controller;
  let getLoanTypesQuery: jest.Mocked<GetLoanTypesQueryHandler>;
  let getLoanTypeDetailQuery: jest.Mocked<GetLoanTypeDetailQueryHandler>;
  let createLoanTypeUseCase: jest.Mocked<CreateLoanTypeUseCase>;
  let updateLoanTypeUseCase: jest.Mocked<UpdateLoanTypeUseCase>;
  let deleteLoanTypeUseCase: jest.Mocked<DeleteLoanTypeUseCase>;
  let createUseCaseSpy: jest.SpyInstance;
  let deleteUseCaseSpy: jest.SpyInstance;

  beforeEach(() => {
    getLoanTypesQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetLoanTypesQueryHandler>;

    getLoanTypeDetailQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetLoanTypeDetailQueryHandler>;

    createLoanTypeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateLoanTypeUseCase>;
    createUseCaseSpy = jest.spyOn(createLoanTypeUseCase, 'execute');

    updateLoanTypeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateLoanTypeUseCase>;

    deleteLoanTypeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteLoanTypeUseCase>;
    deleteUseCaseSpy = jest.spyOn(deleteLoanTypeUseCase, 'execute');

    controller = new LoanTypesV2Controller(
      getLoanTypesQuery,
      getLoanTypeDetailQuery,
      createLoanTypeUseCase,
      updateLoanTypeUseCase,
      deleteLoanTypeUseCase,
    );
  });

  describe('list', () => {
    it('should return mapped array of loan types', async () => {
      // ARRANGE
      getLoanTypesQuery.execute.mockResolvedValue([
        {
          id: 'lt-1',
          code: 'corriente',
          name: 'Corriente',
          interestRate: 0.015,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // ACT
      const result = await controller.list();

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].interest_rate).toBe(0.015);
      expect(result[0].code).toBe('corriente');
    });
  });

  describe('detail', () => {
    it('should return loan type by id', async () => {
      // ARRANGE
      getLoanTypeDetailQuery.execute.mockResolvedValue({
        id: 'lt-1',
        code: 'agil',
        name: 'Ágil',
        interestRate: 0.02,
        description: 'Préstamo ágil',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ACT
      const result = await controller.detail('lt-1');

      // ASSERT
      expect(result.id).toBe('lt-1');
      expect(result.name).toBe('Ágil');
    });

    it('should throw NotFoundException when loan type not found', async () => {
      // ARRANGE
      getLoanTypeDetailQuery.execute.mockRejectedValue(
        new LoanTypeNotFoundException('lt-1'),
      );

      // ACT & ASSERT
      await expect(controller.detail('lt-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should rethrow unknown errors', async () => {
      // ARRANGE
      getLoanTypeDetailQuery.execute.mockRejectedValue(new Error('DB failure'));

      // ACT & ASSERT
      await expect(controller.detail('lt-1')).rejects.toThrow('DB failure');
    });
  });

  describe('create', () => {
    it('should create and return loan type', async () => {
      // ARRANGE
      createLoanTypeUseCase.execute.mockResolvedValue({
        id: 'lt-new',
        code: 'nuevo',
        name: 'Nuevo',
        interestRate: 0.015,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ACT
      const result = await controller.create({
        name: 'Nuevo',
        interest_rate: 0.015,
      });

      // ASSERT
      expect(result.id).toBe('lt-new');
      expect(result.code).toBe('nuevo');
      expect(createUseCaseSpy).toHaveBeenCalledWith({
        name: 'Nuevo',
        code: undefined,
        interestRate: 0.015,
        description: undefined,
      });
    });

    it('should throw BadRequestException when create fails', async () => {
      // ARRANGE
      createLoanTypeUseCase.execute.mockRejectedValue(
        new Error('Duplicate code'),
      );

      // ACT & ASSERT
      await expect(
        controller.create({ name: 'Nuevo', interest_rate: 0.015 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle non-Error exceptions properly', async () => {
      // ARRANGE
      createLoanTypeUseCase.execute.mockRejectedValue('String error');

      // ACT & ASSERT
      await expect(
        controller.create({ name: 'Nuevo', interest_rate: 0.015 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update and return loan type', async () => {
      // ARRANGE
      updateLoanTypeUseCase.execute.mockResolvedValue({
        id: 'lt-1',
        code: 'corriente',
        name: 'Corriente Actualizado',
        interestRate: 0.018,
        description: 'Actualizado',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ACT
      const result = await controller.update('lt-1', {
        name: 'Corriente Actualizado',
        interest_rate: 0.018,
      });

      // ASSERT
      expect(result.name).toBe('Corriente Actualizado');
      expect(result.interest_rate).toBe(0.018);
    });

    it('should throw NotFoundException if loan type not found', async () => {
      // ARRANGE
      updateLoanTypeUseCase.execute.mockRejectedValue(
        new LoanTypeNotFoundException('lt-1'),
      );

      // ACT & ASSERT
      await expect(
        controller.update('lt-1', { name: 'Actualizado' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if update fails with generic error', async () => {
      // ARRANGE
      updateLoanTypeUseCase.execute.mockRejectedValue(
        new Error('Invalid rate'),
      );

      // ACT & ASSERT
      await expect(
        controller.update('lt-1', { interest_rate: -1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete loan type successfully', async () => {
      // ARRANGE
      deleteLoanTypeUseCase.execute.mockResolvedValue();

      // ACT & ASSERT
      await expect(controller.remove('lt-1')).resolves.not.toThrow();
      expect(deleteUseCaseSpy).toHaveBeenCalledWith('lt-1');
    });

    it('should throw NotFoundException if loan type not found', async () => {
      // ARRANGE
      deleteLoanTypeUseCase.execute.mockRejectedValue(
        new LoanTypeNotFoundException('lt-1'),
      );

      // ACT & ASSERT
      await expect(controller.remove('lt-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if deletion fails because of active loans', async () => {
      // ARRANGE
      deleteLoanTypeUseCase.execute.mockRejectedValue(
        new Error('Cannot delete loan type with active loans associated'),
      );

      // ACT & ASSERT
      await expect(controller.remove('lt-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
