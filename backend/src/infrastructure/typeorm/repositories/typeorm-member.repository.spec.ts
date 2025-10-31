import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmMemberRepository } from './typeorm-member.repository';
import { Member as MemberEntity } from '../../../members/entities/member.entity';
import { Member as MemberDomain } from '@domain/entities/member.entity';

describe('TypeOrmMemberRepository', () => {
  let repository: TypeOrmMemberRepository;
  let typeOrmRepo: jest.Mocked<Repository<MemberEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmMemberRepository,
        {
          provide: getRepositoryToken(MemberEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmMemberRepository>(TypeOrmMemberRepository);
    typeOrmRepo = module.get(getRepositoryToken(MemberEntity));
  });

  describe('findById', () => {
    it('should return Member when found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: MemberEntity = {
        id: memberId,
        name: 'Test Member',
        email: 'test@example.com',
        role: 'member',
        status: 'active',
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(memberId);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: memberId, deletedAt: expect.anything() },
      });
      expect(result).toBeInstanceOf(MemberDomain);
      expect(result?.id).toBe(memberId);
    });

    it('should return null when not found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(memberId);

      expect(result).toBeNull();
    });
  });

  describe('findActive', () => {
    it('should return array of active members', async () => {
      const entities: MemberEntity[] = [
        {
          id: '1',
          name: 'Active 1',
          email: 'active1@example.com',
          role: 'member',
          status: 'active',
          registrationDate: new Date(),
          createdAt: new Date(),
          deletedAt: null as any,
          identificationNumber: null as any,
          address: null as any,
          phone: null as any,
          beneficiary: null as any,
        },
        {
          id: '2',
          name: 'Active 2',
          email: 'active2@example.com',
          role: 'member',
          status: 'active',
          registrationDate: new Date(),
          createdAt: new Date(),
          deletedAt: null as any,
          identificationNumber: null as any,
          address: null as any,
          phone: null as any,
          beneficiary: null as any,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      const result = await repository.findActive();

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything(), status: 'active' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MemberDomain);
      expect(result[1]).toBeInstanceOf(MemberDomain);
    });

    it('should return empty array when no active members', async () => {
      typeOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should insert new member when not exists', async () => {
      const domainMember = MemberDomain.create({
        name: 'New Member',
        email: 'new@example.com',
      });

      const savedEntity: MemberEntity = {
        id: domainMember.id,
        name: domainMember.name,
        email: domainMember.email,
        role: domainMember.role,
        status: domainMember.status,
        registrationDate: domainMember.registrationDate,
        createdAt: domainMember.createdAt,
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      typeOrmRepo.findOne.mockResolvedValueOnce(null); // Check if exists
      typeOrmRepo.save.mockResolvedValue(savedEntity);

      const result = await repository.save(domainMember);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: domainMember.id },
        withDeleted: true,
      });
      expect(typeOrmRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(MemberDomain);
    });

    it('should update existing member', async () => {
      const domainMember = MemberDomain.create({
        name: 'Updated Member',
        email: 'updated@example.com',
      });

      const existingEntity: MemberEntity = {
        id: domainMember.id,
        name: 'Original',
        email: 'original@example.com',
        role: 'member',
        status: 'active',
        registrationDate: new Date(),
        createdAt: new Date(),
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      const updatedEntity: MemberEntity = {
        ...existingEntity,
        name: 'Updated Member',
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Check if exists
        .mockResolvedValueOnce(updatedEntity); // After update

      typeOrmRepo.update.mockResolvedValue(undefined as any);

      const result = await repository.save(domainMember);

      expect(typeOrmRepo.update).toHaveBeenCalledWith(
        domainMember.id,
        expect.any(Object),
      );
      expect(result).toBeInstanceOf(MemberDomain);
      expect(result.name).toBe('Updated Member');
    });

    it('should throw error when member not found after update', async () => {
      const domainMember = MemberDomain.create({
        name: 'To Update',
        email: 'update@example.com',
      });

      const existingEntity: MemberEntity = {
        id: domainMember.id,
        name: 'Original',
        email: 'original@example.com',
        role: 'member',
        status: 'active',
        registrationDate: new Date(),
        createdAt: new Date(),
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Check if exists
        .mockResolvedValueOnce(null); // After update - not found

      typeOrmRepo.update.mockResolvedValue(undefined as any);

      await expect(repository.save(domainMember)).rejects.toThrow(
        'Member not found after update',
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete member successfully', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.softDelete.mockResolvedValue({ affected: 1 } as any);

      await repository.softDelete(memberId);

      expect(typeOrmRepo.softDelete).toHaveBeenCalledWith(memberId);
    });

    it('should throw error when member not found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.softDelete.mockResolvedValue({ affected: 0 } as any);

      await expect(repository.softDelete(memberId)).rejects.toThrow(
        'Member not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update member status', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.update.mockResolvedValue(undefined as any);

      await repository.updateStatus(memberId, 'inactive');

      expect(typeOrmRepo.update).toHaveBeenCalledWith(memberId, {
        status: 'inactive',
      });
    });
  });

  describe('findByIdWithDeleted', () => {
    it('should return Member when found and not deleted', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: MemberEntity = {
        id: memberId,
        name: 'Not Deleted',
        email: 'notdeleted@example.com',
        role: 'member',
        status: 'active',
        registrationDate: new Date(),
        createdAt: new Date(),
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByIdWithDeleted(memberId);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: memberId },
        withDeleted: true,
      });
      expect(result).toBeInstanceOf(MemberDomain);
    });

    it('should return null when member is deleted', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: MemberEntity = {
        id: memberId,
        name: 'Deleted',
        email: 'deleted@example.com',
        role: 'member',
        status: 'inactive',
        registrationDate: new Date(),
        createdAt: new Date(),
        deletedAt: new Date(),
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByIdWithDeleted(memberId);

      expect(result).toBeNull();
    });

    it('should return null when member not found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByIdWithDeleted(memberId);

      expect(result).toBeNull();
    });
  });
});
