import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MeetingSummaryService } from './meeting-summary.service';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';

describe('MeetingSummaryService', () => {
  let service: MeetingSummaryService;

  const mockDataSource = {
    getRepository: jest.fn(),
  };

  const mockLedgerRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockOperationRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingSummaryService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<MeetingSummaryService>(MeetingSummaryService);

    mockDataSource.getRepository.mockImplementation((entity) => {
      if (entity === LedgerEntry) {
        return mockLedgerRepo;
      }
      if (entity === Operation) {
        return mockOperationRepo;
      }
      return null;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSummary', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return empty summary when no operations exist', async () => {
      // ARRANGE
      mockOperationRepo.find.mockResolvedValue([]);

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result).toEqual({
        totalCash: 0,
        totalInterest: 0,
        totalLoans: 0,
        totalCollected: 0,
        totalDividends: 0,
        totalStockInvestment: 0,
        finalCashBalance: 0,
        totalDisbursed: 0,
        participantsCount: 0,
        duration: '0h 0m',
      });
    });

    it('should calculate all summary fields correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          date: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          date: new Date('2024-01-15T12:30:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      // Mock query builder for ledger entries
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Mock sumByAccountType calls
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ sum: '150000.00' }) // totalCash
        .mockResolvedValueOnce({ sum: '5000.00' }) // totalInterest
        .mockResolvedValueOnce({ sum: '20000.00' }) // totalLoans
        .mockResolvedValueOnce({ sum: '150000.00' }) // cashIn (positive only)
        .mockResolvedValueOnce({ sum: '5000.00' }) // noveltyLoss
        .mockResolvedValueOnce({ sum: '10000.00' }) // totalDividends
        .mockResolvedValueOnce({ sum: '30000.00' }) // totalStockInvestment
        .mockResolvedValueOnce({ sum: '150000.00' }) // totalDebits
        .mockResolvedValueOnce({ sum: '-30000.00' }); // credits (negative)

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result.totalCash).toBe(150000.0);
      expect(result.totalInterest).toBe(5000.0);
      expect(result.totalLoans).toBe(20000.0);
      expect(result.totalCollected).toBe(145000.0); // 150000 - 5000
      expect(result.totalDividends).toBe(10000.0);
      expect(result.totalStockInvestment).toBe(30000.0);
      expect(result.finalCashBalance).toBe(120000.0); // 150000 - 30000
      expect(result.totalDisbursed).toBe(30000.0);
      expect(result.participantsCount).toBe(2);
      expect(result.duration).toBe('2h 30m');
    });

    it('should calculate duration correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          date: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          date: new Date('2024-01-15T11:45:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '0' }),
      };

      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result.duration).toBe('1h 45m');
    });

    it('should handle null sums correctly', async () => {
      // ARRANGE
      const operations = [
        {
          id: 'op-1',
          memberId: 'member-1',
          date: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockOperationRepo.find.mockResolvedValue(operations);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: null }),
      };

      mockLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // ACT
      const result = await service.calculateSummary(meetingId);

      // ASSERT
      expect(result.totalCash).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalCollected).toBe(0);
    });
  });
});
