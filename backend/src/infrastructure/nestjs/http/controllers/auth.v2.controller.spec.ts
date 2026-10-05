/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuthV2Controller } from './auth.v2.controller';
import { CheckMemberActiveUseCase } from '@application/use-cases/members/check-member-active.use-case';
import { GetAuthenticatedMemberQueryHandler } from '@application/queries/auth/get-authenticated-member.query-handler';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthV2Controller', () => {
  let controller: AuthV2Controller;
  let checkMemberActiveUseCase: jest.Mocked<CheckMemberActiveUseCase>;
  let checkMemberActiveSpy: jest.SpyInstance;
  let getAuthenticatedMemberQuery: jest.Mocked<GetAuthenticatedMemberQueryHandler>;
  let getAuthenticatedMemberSpy: jest.SpyInstance;

  beforeEach(() => {
    checkMemberActiveUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CheckMemberActiveUseCase>;
    checkMemberActiveSpy = jest.spyOn(checkMemberActiveUseCase, 'execute');

    getAuthenticatedMemberQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetAuthenticatedMemberQueryHandler>;
    getAuthenticatedMemberSpy = jest.spyOn(
      getAuthenticatedMemberQuery,
      'execute',
    );

    controller = new AuthV2Controller(
      checkMemberActiveUseCase,
      getAuthenticatedMemberQuery,
    );
  });

  describe('validateEmail', () => {
    it('should return { exists: true, active: true } when member is active', async () => {
      // ARRANGE
      const dto = { email: 'socio@ejemplo.com' };
      const expectedResponse = { exists: true, active: true };
      checkMemberActiveUseCase.execute.mockResolvedValue(expectedResponse);

      // ACT
      const result = await controller.validateEmail(dto);

      // ASSERT
      expect(checkMemberActiveSpy).toHaveBeenCalledWith({
        email: 'socio@ejemplo.com',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return { exists: true, active: false } when member is inactive', async () => {
      // ARRANGE
      const dto = { email: 'inactivo@ejemplo.com' };
      const expectedResponse = { exists: true, active: false };
      checkMemberActiveUseCase.execute.mockResolvedValue(expectedResponse);

      // ACT
      const result = await controller.validateEmail(dto);

      // ASSERT
      expect(checkMemberActiveSpy).toHaveBeenCalledWith({
        email: 'inactivo@ejemplo.com',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return { exists: false, active: false } when member does not exist', async () => {
      // ARRANGE
      const dto = { email: 'desconocido@ejemplo.com' };
      const expectedResponse = { exists: false, active: false };
      checkMemberActiveUseCase.execute.mockResolvedValue(expectedResponse);

      // ACT
      const result = await controller.validateEmail(dto);

      // ASSERT
      expect(checkMemberActiveSpy).toHaveBeenCalledWith({
        email: 'desconocido@ejemplo.com',
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getMe', () => {
    it('should return member profile successfully when member is authenticated and active', async () => {
      // ARRANGE
      const currentUser = {
        id: 'member-uuid-1',
        email: 'carlos.socio@ejemplo.com',
        role: 'member',
      };
      const queryResponse = {
        id: 'member-uuid-1',
        name: 'Carlos Martínez',
        email: 'carlos.socio@ejemplo.com',
        role: 'member',
        status: 'active',
        identificationNumber: '1098765432',
        phone: '+573001234567',
        address: 'Calle 10 # 20-30',
        beneficiary: 'Laura Martínez',
        registrationDate: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      getAuthenticatedMemberQuery.execute.mockResolvedValue(queryResponse);

      // ACT
      const result = await controller.getMe(currentUser);

      // ASSERT
      expect(getAuthenticatedMemberSpy).toHaveBeenCalledTimes(1);
      expect(getAuthenticatedMemberSpy).toHaveBeenCalledWith({
        email: 'carlos.socio@ejemplo.com',
      });
      expect(result).toEqual({
        id: 'member-uuid-1',
        name: 'Carlos Martínez',
        email: 'carlos.socio@ejemplo.com',
        role: 'member',
        status: 'active',
        identification_number: '1098765432',
        phone: '+573001234567',
        address: 'Calle 10 # 20-30',
        beneficiary: 'Laura Martínez',
        registration_date: queryResponse.registrationDate,
        created_at: queryResponse.createdAt,
      });
    });

    it('should throw UnauthorizedException when currentUser is missing or has no email', async () => {
      // ACT & ASSERT
      await expect(controller.getMe(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        controller.getMe({ id: '1', email: '', role: 'member' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(getAuthenticatedMemberSpy).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when query handler throws an Error', async () => {
      // ARRANGE
      const currentUser = {
        id: 'member-uuid-1',
        email: 'inactivo@ejemplo.com',
        role: 'member',
      };
      getAuthenticatedMemberQuery.execute.mockRejectedValue(
        new Error('Member is not active'),
      );

      // ACT & ASSERT
      await expect(controller.getMe(currentUser)).rejects.toThrow(
        new UnauthorizedException('Member is not active'),
      );
      expect(getAuthenticatedMemberSpy).toHaveBeenCalledWith({
        email: 'inactivo@ejemplo.com',
      });
    });

    it('should throw UnauthorizedException when query handler throws a non-Error exception', async () => {
      // ARRANGE
      const currentUser = {
        id: 'member-uuid-1',
        email: 'error@ejemplo.com',
        role: 'member',
      };
      getAuthenticatedMemberQuery.execute.mockRejectedValue('Unknown error');

      // ACT & ASSERT
      await expect(controller.getMe(currentUser)).rejects.toThrow(
        new UnauthorizedException('Socio no autorizado'),
      );
    });
  });
});
