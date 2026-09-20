/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { MemberRepository } from '../../../../domain/ports/repositories/member-repository.port';
import { MemberRole } from '../../../../domain/enums/member-role.enum';
import { Member } from '../../../../domain/entities/member.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let findByEmailSpy: jest.SpyInstance;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    memberRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      findByIdWithDeleted: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    findByEmailSpy = jest.spyOn(memberRepository, 'findByEmail');

    guard = new RolesGuard(reflector, memberRepository);
    jest.clearAllMocks();
  });

  it('should return true if no required roles are defined', async () => {
    // ARRANGE
    reflector.getAllAndOverride.mockReturnValue(undefined);

    // ACT
    const result = await guard.canActivate(mockExecutionContext);

    // ASSERT
    expect(result).toBe(true);
  });

  it('should return false if no user or email in request', async () => {
    // ARRANGE
    reflector.getAllAndOverride.mockReturnValue([MemberRole.ADMIN]);
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({});

    // ACT
    const result = await guard.canActivate(mockExecutionContext);

    // ASSERT
    expect(result).toBe(false);
  });

  it('should return false if member is not found by email', async () => {
    // ARRANGE
    reflector.getAllAndOverride.mockReturnValue([MemberRole.ADMIN]);
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      user: { email: 'unknown@example.com' },
    });
    findByEmailSpy.mockResolvedValue(null);

    // ACT
    const result = await guard.canActivate(mockExecutionContext);

    // ASSERT
    expect(findByEmailSpy).toHaveBeenCalledWith('unknown@example.com');
    expect(result).toBe(false);
  });

  it('should return false if member does not have required role', async () => {
    // ARRANGE
    reflector.getAllAndOverride.mockReturnValue([MemberRole.ADMIN]);
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      user: { email: 'member@example.com' },
    });
    const member = Member.create({
      name: 'Regular Member',
      email: 'member@example.com',
      role: MemberRole.MEMBER,
    });
    findByEmailSpy.mockResolvedValue(member);

    // ACT
    const result = await guard.canActivate(mockExecutionContext);

    // ASSERT
    expect(findByEmailSpy).toHaveBeenCalledWith('member@example.com');
    expect(result).toBe(false);
  });

  it('should return true if member has required role', async () => {
    // ARRANGE
    reflector.getAllAndOverride.mockReturnValue([MemberRole.ADMIN]);
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      user: { email: 'admin@example.com' },
    });
    const admin = Member.create({
      name: 'Admin User',
      email: 'admin@example.com',
      role: MemberRole.ADMIN,
    });
    findByEmailSpy.mockResolvedValue(admin);

    // ACT
    const result = await guard.canActivate(mockExecutionContext);

    // ASSERT
    expect(findByEmailSpy).toHaveBeenCalledWith('admin@example.com');
    expect(result).toBe(true);
  });
});
