/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { GetAuthenticatedMemberQueryHandler } from './get-authenticated-member.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';

describe('GetAuthenticatedMemberQueryHandler', () => {
  let queryHandler: GetAuthenticatedMemberQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;
  let findByEmailSpy: jest.SpyInstance;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByEmail: jest.fn(),
      findByIdentificationNumber: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    findByEmailSpy = jest.spyOn(memberRepository, 'findByEmail');

    queryHandler = new GetAuthenticatedMemberQueryHandler(memberRepository);
  });

  describe('execute', () => {
    it('should return member profile for an active member successfully', async () => {
      // ARRANGE
      const member = Member.fromPersistence({
        id: 'member-uuid-1',
        name: 'Carlos Martínez',
        email: 'carlos.socio@ejemplo.com',
        status: 'active',
        role: 'member',
        identificationNumber: '1098765432',
        phone: '+573001234567',
        address: 'Calle 10 # 20-30',
        beneficiary: 'Laura Martínez',
        registrationDate: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      memberRepository.findByEmail.mockResolvedValue(member);

      // ACT
      const result = await queryHandler.execute({
        email: '  CARLOS.SOCIO@EJEMPLO.COM  ',
      });

      // ASSERT
      expect(findByEmailSpy).toHaveBeenCalledTimes(1);
      expect(findByEmailSpy).toHaveBeenCalledWith('carlos.socio@ejemplo.com');
      expect(result).toEqual({
        id: 'member-uuid-1',
        name: 'Carlos Martínez',
        email: 'carlos.socio@ejemplo.com',
        role: 'member',
        status: 'active',
        identificationNumber: '1098765432',
        phone: '+573001234567',
        address: 'Calle 10 # 20-30',
        beneficiary: 'Laura Martínez',
        registrationDate: member.registrationDate,
        createdAt: member.createdAt,
      });
    });

    it('should throw an error when email is empty or whitespace', async () => {
      // ARRANGE
      const query = { email: '   ' };

      // ACT & ASSERT
      await expect(queryHandler.execute(query)).rejects.toThrow(
        'Email is required',
      );
      expect(findByEmailSpy).not.toHaveBeenCalled();
    });

    it('should throw an error when member is not found', async () => {
      // ARRANGE
      memberRepository.findByEmail.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        queryHandler.execute({ email: 'inexistente@ejemplo.com' }),
      ).rejects.toThrow('Member not found');
      expect(findByEmailSpy).toHaveBeenCalledWith('inexistente@ejemplo.com');
    });

    it('should throw an error when member is inactive', async () => {
      // ARRANGE
      const inactiveMember = Member.fromPersistence({
        id: 'member-uuid-2',
        name: 'Inactivo Usuario',
        email: 'inactivo@ejemplo.com',
        status: 'inactive',
        role: 'member',
        registrationDate: new Date('2026-01-01'),
      });
      memberRepository.findByEmail.mockResolvedValue(inactiveMember);

      // ACT & ASSERT
      await expect(
        queryHandler.execute({ email: 'inactivo@ejemplo.com' }),
      ).rejects.toThrow('Member is not active');
      expect(findByEmailSpy).toHaveBeenCalledWith('inactivo@ejemplo.com');
    });
  });
});
