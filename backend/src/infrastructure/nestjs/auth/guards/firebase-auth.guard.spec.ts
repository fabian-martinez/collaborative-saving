import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { GetAuthenticatedUserQuery } from '@application/queries/auth/get-authenticated-user.query';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn(),
  } as unknown as ExecutionContext;

  const mockQuery = {
    execute: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: GetAuthenticatedUserQuery, useValue: mockQuery },
      ],
    }).compile();

    guard = module.get<FirebaseAuthGuard>(FirebaseAuthGuard);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for public routes', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      [mockExecutionContext.getHandler(), mockExecutionContext.getClass()],
    );
  });

  it('should throw UnauthorizedException if no token provided', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      headers: {},
    });

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token is invalid format', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      headers: { authorization: 'InvalidFormat token' },
    });

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if query returns null (user not found/invalid)', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      headers: { authorization: 'Bearer validtoken' },
    });
    mockQuery.execute.mockResolvedValue(null);

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockQuery.execute).toHaveBeenCalledWith('validtoken');
  });

  it('should attach user to request and return true if authentication succeeds', async () => {
    const mockUser = { id: 'u1', email: 'e@e.com', role: 'member' };
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const mockRequest = {
      headers: { authorization: 'Bearer validtoken' },
    };
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);
    mockQuery.execute.mockResolvedValue(mockUser);

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(mockRequest['user']).toEqual(mockUser);
  });
});
