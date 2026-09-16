import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull, UpdateResult } from 'typeorm';
import { TypeOrmMemberRepository } from './typeorm-member.repository';
import { Member as MemberEntity } from '../entities/member.entity';
import { Member as MemberDomain } from '@domain/entities/member.entity';
import { CRYPTO_SERVICE } from '@domain/constants/injection-tokens';
import { CryptoServicePort } from '@domain/ports/services/crypto-service.port';

describe('TypeOrmMemberRepository', () => {
  let repository: TypeOrmMemberRepository;
  let typeOrmRepo: jest.Mocked<Repository<MemberEntity>>;
  let mockCryptoService: jest.Mocked<CryptoServicePort>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    mockCryptoService = {
      encrypt: jest.fn((val) => val),
      decrypt: jest.fn((val) => val),
      hashBlindIndex: jest.fn((val) => (val ? `hash_${val}` : val)),
      isEncrypted: jest.fn((val: string | null | undefined) =>
        Boolean(val && false),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmMemberRepository,
        {
          provide: getRepositoryToken(MemberEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: CRYPTO_SERVICE,
          useValue: mockCryptoService,
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
        deletedAt: null,
        identificationNumber: null as unknown as string,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(memberId);

      const findOneCall = typeOrmRepo.findOne.mock.calls[0][0];
      const where = Array.isArray(findOneCall.where)
        ? findOneCall.where[0]
        : findOneCall.where;
      expect(where?.id).toBe(memberId);
      expect(where?.deletedAt).toEqual(IsNull());
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

  describe('findByEmail', () => {
    it('should return Member when found', async () => {
      const email = 'test@example.com';
      const entity: MemberEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Member',
        email: email,
        role: 'member',
        status: 'active',
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null,
        identificationNumber: null as unknown as string,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByEmail(email);

      const findOneCall = typeOrmRepo.findOne.mock.calls[0][0];
      expect(findOneCall.where).toEqual([
        { emailHash: 'hash_test@example.com', deletedAt: IsNull() },
        { email: 'test@example.com', deletedAt: IsNull() },
      ]);
      expect(result).toBeInstanceOf(MemberDomain);
      expect(result?.email).toBe(email);
    });

    it('should return null when not found', async () => {
      const email = 'test@example.com';
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findByIdentificationNumber', () => {
    it('should return Member when found', async () => {
      const idNum = '123456789';
      const entity: MemberEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Member',
        email: 'test@example.com',
        role: 'member',
        status: 'active',
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null,
        identificationNumber: idNum,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByIdentificationNumber(idNum);

      const findOneCall = typeOrmRepo.findOne.mock.calls[0][0];
      expect(findOneCall.where).toEqual([
        { identificationNumberHash: 'hash_123456789', deletedAt: IsNull() },
        { identificationNumber: '123456789', deletedAt: IsNull() },
      ]);
      expect(result).toBeInstanceOf(MemberDomain);
      expect(result?.identificationNumber).toBe(idNum);
    });

    it('should return null when not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByIdentificationNumber('123456789');

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
          deletedAt: null,
          identificationNumber: null as unknown as string,
          address: null as unknown as string,
          phone: null as unknown as string,
          beneficiary: null as unknown as string,
        },
        {
          id: '2',
          name: 'Active 2',
          email: 'active2@example.com',
          role: 'member',
          status: 'active',
          registrationDate: new Date(),
          createdAt: new Date(),
          deletedAt: null,
          identificationNumber: null as unknown as string,
          address: null as unknown as string,
          phone: null as unknown as string,
          beneficiary: null as unknown as string,
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      const result = await repository.findActive();

      const findCall = typeOrmRepo.find.mock.calls[0]?.[0];
      expect(findCall).toBeDefined();
      if (!findCall) return;
      const where = Array.isArray(findCall.where)
        ? findCall.where[0]
        : findCall.where;
      expect(where?.deletedAt).toEqual(IsNull());
      expect(where?.status).toBe('active');
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
        deletedAt: null,
        identificationNumber: null as unknown as string,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
      };

      typeOrmRepo.findOne.mockResolvedValueOnce(null); // Check if exists
      typeOrmRepo.save.mockResolvedValue(savedEntity);

      const result = await repository.save(domainMember);

      const findOneCall = typeOrmRepo.findOne.mock.calls[0][0];
      const where = Array.isArray(findOneCall.where)
        ? findOneCall.where[0]
        : findOneCall.where;
      expect(where?.id).toBe(domainMember.id);
      expect(findOneCall.withDeleted).toBe(true);
      expect(typeOrmRepo.save.mock.calls.length).toBe(1);
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
        deletedAt: null,
        identificationNumber: null as unknown as string,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
      };

      const updatedEntity: MemberEntity = {
        ...existingEntity,
        name: 'Updated Member',
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Check if exists
        .mockResolvedValueOnce(updatedEntity); // After update

      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      typeOrmRepo.update.mockResolvedValue(updateResult);

      const result = await repository.save(domainMember);

      expect(typeOrmRepo.update.mock.calls[0][0]).toBe(domainMember.id);
      expect(typeOrmRepo.update.mock.calls[0][1]).toBeDefined();
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
        deletedAt: null,
        identificationNumber: null as unknown as string,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Check if exists
        .mockResolvedValueOnce(null); // After update - not found

      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      typeOrmRepo.update.mockResolvedValue(updateResult);

      await expect(repository.save(domainMember)).rejects.toThrow(
        'Member not found after update',
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete member successfully', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      typeOrmRepo.softDelete.mockResolvedValue(updateResult);

      await repository.softDelete(memberId);

      expect(typeOrmRepo.softDelete.mock.calls[0][0]).toBe(memberId);
    });

    it('should throw error when member not found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const updateResult: UpdateResult = {
        affected: 0,
        raw: {},
        generatedMaps: [],
      };
      typeOrmRepo.softDelete.mockResolvedValue(updateResult);

      await expect(repository.softDelete(memberId)).rejects.toThrow(
        'Member not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update member status', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      typeOrmRepo.update.mockResolvedValue(updateResult);

      await repository.updateStatus(memberId, 'inactive');

      expect(typeOrmRepo.update.mock.calls[0][0]).toBe(memberId);
      expect(typeOrmRepo.update.mock.calls[0][1]).toEqual({
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
        deletedAt: null,
        identificationNumber: null as unknown as string,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByIdWithDeleted(memberId);

      const findOneCall = typeOrmRepo.findOne.mock.calls[0][0];
      const where = Array.isArray(findOneCall.where)
        ? findOneCall.where[0]
        : findOneCall.where;
      expect(where?.id).toBe(memberId);
      expect(findOneCall.withDeleted).toBe(true);
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
        identificationNumber: null as unknown as string,
        address: null as unknown as string,
        phone: null as unknown as string,
        beneficiary: null as unknown as string,
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
