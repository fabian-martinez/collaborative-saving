/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { AuthV2Controller } from './auth.v2.controller';
import { CheckMemberActiveUseCase } from '@application/use-cases/members/check-member-active.use-case';

describe('AuthV2Controller', () => {
  let controller: AuthV2Controller;
  let checkMemberActiveUseCase: jest.Mocked<CheckMemberActiveUseCase>;
  let checkMemberActiveSpy: jest.SpyInstance;

  beforeEach(() => {
    checkMemberActiveUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CheckMemberActiveUseCase>;
    checkMemberActiveSpy = jest.spyOn(checkMemberActiveUseCase, 'execute');

    controller = new AuthV2Controller(checkMemberActiveUseCase);
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
});
