import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmMeetingRepository } from './typeorm-meeting.repository';
import { Meeting as MeetingEntity } from '../entities/meeting.entity';
import { Meeting as MeetingDomain } from '@domain/entities/meeting.entity';
import { MeetingStatus } from '@domain/entities/meeting.entity';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

describe('TypeOrmMeetingRepository', () => {
  let repository: TypeOrmMeetingRepository;
  let typeOrmRepo: jest.Mocked<Repository<MeetingEntity>>;
  let findOneSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionManager = {
      execute: jest.fn(),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmMeetingRepository,
        {
          provide: getRepositoryToken(MeetingEntity),
          useValue: mockTypeOrmRepo,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmMeetingRepository>(TypeOrmMeetingRepository);
    typeOrmRepo = module.get(getRepositoryToken(MeetingEntity));

    // Create spies to avoid 'this' scoping issues
    findOneSpy = jest.spyOn(typeOrmRepo, 'findOne');
    findSpy = jest.spyOn(typeOrmRepo, 'find');
    saveSpy = jest.spyOn(typeOrmRepo, 'save');
    updateSpy = jest.spyOn(typeOrmRepo, 'update');
  });

  describe('findById', () => {
    it('should return Meeting when found', async () => {
      // Arrange
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      const entity: MeetingEntity = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: 'active',
        notes: 'Test meeting',
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      // Act
      const result = await repository.findById(meetingId);

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: meetingId },
      });
      expect(result).toBeInstanceOf(MeetingDomain);
      expect(result?.id).toBe(meetingId);
    });

    it('should return null when not found', async () => {
      // Arrange
      const meetingId = '550e8400-e29b-41d4-a716-446655440000';
      typeOrmRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(meetingId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findActive', () => {
    it('should return active meeting when found', async () => {
      // Arrange
      const entity: MeetingEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: 'active',
        notes: 'Test meeting',
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      // Act
      const result = await repository.findActive();

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
      expect(result).toBeInstanceOf(MeetingDomain);
      expect(result?.status).toBe(MeetingStatus.ACTIVE);
    });

    it('should return null when no active meeting found', async () => {
      // Arrange
      typeOrmRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findActive();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return array of meetings ordered by date DESC', async () => {
      // Arrange
      const entities: MeetingEntity[] = [
        {
          id: 'meeting-1',
          date: new Date('2024-02-15'),
          status: 'closed',
          notes: 'Meeting 1',
        },
        {
          id: 'meeting-2',
          date: new Date('2024-01-15'),
          status: 'closed',
          notes: 'Meeting 2',
        },
      ];

      typeOrmRepo.find.mockResolvedValue(entities);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(findSpy).toHaveBeenCalledWith({
        order: { date: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MeetingDomain);
      expect(result[0].id).toBe('meeting-1');
      expect(result[1].id).toBe('meeting-2');
    });

    it('should return empty array when no meetings found', async () => {
      // Arrange
      typeOrmRepo.find.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should insert new meeting when not exists', async () => {
      // Arrange
      const meeting = MeetingDomain.create({
        date: new Date('2024-01-15'),
        notes: 'Test meeting',
      });

      const entity: MeetingEntity = {
        id: meeting.id,
        date: meeting.date,
        status: 'active',
        notes: 'Test meeting',
      };

      typeOrmRepo.findOne.mockResolvedValueOnce(null); // Not found
      typeOrmRepo.save.mockResolvedValue(entity);

      // Act
      const result = await repository.save(meeting);

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: meeting.id },
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toBeInstanceOf(MeetingDomain);
      expect(result.id).toBe(meeting.id);
    });

    it('should update existing meeting when exists', async () => {
      // Arrange
      const meeting = MeetingDomain.create({
        date: new Date('2024-01-15'),
        notes: 'Updated meeting',
      });

      const existingEntity: MeetingEntity = {
        id: meeting.id,
        date: new Date('2024-01-15'),
        status: 'active',
        notes: 'Original meeting',
      };

      const updatedEntity: MeetingEntity = {
        id: meeting.id,
        date: new Date('2024-01-15'),
        status: 'active',
        notes: 'Updated meeting',
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Found existing
        .mockResolvedValueOnce(updatedEntity); // After update
      updateSpy.mockResolvedValue(undefined as any);

      // Act
      const result = await repository.save(meeting);

      // Assert
      expect(findOneSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith(meeting.id, expect.any(Object));
      expect(result).toBeInstanceOf(MeetingDomain);
      expect(result.id).toBe(meeting.id);
    });

    it('should throw error when meeting not found after update', async () => {
      // Arrange
      const meeting = MeetingDomain.create({
        date: new Date('2024-01-15'),
        notes: 'Test meeting',
      });

      const existingEntity: MeetingEntity = {
        id: meeting.id,
        date: new Date('2024-01-15'),
        status: 'active',
        notes: 'Original meeting',
      };

      typeOrmRepo.findOne
        .mockResolvedValueOnce(existingEntity) // Found existing
        .mockResolvedValueOnce(null); // Not found after update
      updateSpy.mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(repository.save(meeting)).rejects.toThrow(
        'Meeting not found after update',
      );
    });
  });

  describe('findLatestClosed', () => {
    it('should return latest closed meeting when found', async () => {
      // Arrange
      const entity: MeetingEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: 'closed',
        notes: 'Closed meeting',
      };

      typeOrmRepo.findOne.mockResolvedValue(entity);

      // Act
      const result = await repository.findLatestClosed();

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { status: 'closed' },
        order: { date: 'DESC' },
      });
      expect(result).toBeInstanceOf(MeetingDomain);
      expect(result?.status).toBe(MeetingStatus.CLOSED);
    });

    it('should return null when no closed meeting found', async () => {
      // Arrange
      typeOrmRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findLatestClosed();

      // Assert
      expect(result).toBeNull();
    });
  });
});
