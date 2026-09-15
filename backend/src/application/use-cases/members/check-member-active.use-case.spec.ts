/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { CheckMemberActiveUseCase } from './check-member-active.use-case';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';

describe('CheckMemberActiveUseCase', () => {
  let useCase: CheckMemberActiveUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let findByEmailSpy: jest.SpyInstance;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByEmail: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    findByEmailSpy = jest.spyOn(memberRepository, 'findByEmail');

    useCase = new CheckMemberActiveUseCase(memberRepository);
  });

  it('should return { exists: false, active: false } when member does not exist', async () => {
    // ARRANGE
    const dto = { email: 'nonexistent@example.com' };
    memberRepository.findByEmail.mockResolvedValue(null);

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(findByEmailSpy).toHaveBeenCalledWith('nonexistent@example.com');
    expect(result).toEqual({ exists: false, active: false });
  });

  it('should return { exists: true, active: true } when member exists and is active', async () => {
    // ARRANGE
    const activeMember = Member.create({
      name: 'Active Member',
      email: 'active@example.com',
    });
    memberRepository.findByEmail.mockResolvedValue(activeMember);

    // ACT
    const result = await useCase.execute({ email: 'active@example.com' });

    // ASSERT
    expect(findByEmailSpy).toHaveBeenCalledWith('active@example.com');
    expect(result).toEqual({ exists: true, active: true });
  });

  it('should return { exists: true, active: false } when member exists and is inactive', async () => {
    // ARRANGE
    const inactiveMember = Member.fromPersistence({
      id: 'member-123',
      name: 'Inactive Member',
      email: 'inactive@example.com',
      status: 'inactive',
      role: 'member',
      registrationDate: new Date(),
    });
    memberRepository.findByEmail.mockResolvedValue(inactiveMember);

    // ACT
    const result = await useCase.execute({ email: 'inactive@example.com' });

    // ASSERT
    expect(findByEmailSpy).toHaveBeenCalledWith('inactive@example.com');
    expect(result).toEqual({ exists: true, active: false });
  });

  it('should trim and lowercase email before querying the repository', async () => {
    // ARRANGE
    const activeMember = Member.create({
      name: 'Active Member',
      email: 'user@example.com',
    });
    memberRepository.findByEmail.mockResolvedValue(activeMember);

    // ACT
    const result = await useCase.execute({ email: '  USER@EXAMPLE.COM  ' });

    // ASSERT
    expect(findByEmailSpy).toHaveBeenCalledWith('user@example.com');
    expect(result).toEqual({ exists: true, active: true });
  });

  it('should return { exists: false, active: false } without calling repository if email is empty', async () => {
    // ARRANGE
    const dto = { email: '   ' };

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(findByEmailSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ exists: false, active: false });
  });

  it('should return { exists: false, active: false } without calling repository if email is missing or falsy', async () => {
    // ARRANGE
    const dto = { email: undefined as unknown as string };

    // ACT
    const result = await useCase.execute(dto);

    // ASSERT
    expect(findByEmailSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ exists: false, active: false });
  });
});
