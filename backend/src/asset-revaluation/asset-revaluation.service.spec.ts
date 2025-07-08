import { Test, TestingModule } from '@nestjs/testing';
import { AssetRevaluationService } from './asset-revaluation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Meeting } from '../meetings/entities/meeting.entity';
import { NotFoundException } from '@nestjs/common';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import {
  INTEREST_INCOME_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '../common/constants/account-types';

describe('AssetRevaluationService', () => {
  let service: AssetRevaluationService;
  let dataSource: jest.Mocked<DataSource>;
  let meetingRepository: jest.Mocked<Repository<Meeting>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetRevaluationService,
        {
          provide: DataSource,
          useValue: {
            manager: {
              find: jest.fn(),
            },
            createQueryRunner: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Meeting),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AssetRevaluationService>(AssetRevaluationService);
    dataSource = module.get(DataSource);
    meetingRepository = module.get(getRepositoryToken(Meeting));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRevaluationPreview', () => {
    const meetingId = 'meeting-1';
    const mockMeeting = { id: meetingId, date: new Date() };

    // Mock data
    const mockGuaranteedStock = {
      id: 'stock-g',
      is_guaranteed: true,
      value: 100000,
      guaranteed_yield: 0.01,
    };
    const mockRegularStock = {
      id: 'stock-r',
      is_guaranteed: false,
      value: 50000,
      monthly_contribution: 1000,
    };
    const mockSubscriptions = [
      { stock_id: 'stock-g', quantity: 10 },
      { stock_id: 'stock-r', quantity: 20 },
    ];
    const mockInterestLedgerEntry = {
      account_type: INTEREST_INCOME_ACCOUNT,
      amount: 20000,
    };
    const mockContributionLedgerEntry = {
      account_type: STOCK_CAPITAL_ACCOUNT,
      amount: 50000,
    };

    it('should calculate revaluation preview correctly for base scenario', async () => {
      meetingRepository.findOneBy.mockResolvedValue(mockMeeting as any);
      (dataSource.manager.find as jest.Mock).mockImplementation(
        (entity: any) => {
          if (entity === LedgerEntry) {
            return Promise.resolve([
              mockInterestLedgerEntry,
              mockContributionLedgerEntry,
            ]);
          }
          if (entity === Stock) {
            return Promise.resolve([mockGuaranteedStock, mockRegularStock]);
          }
          if (entity === StockSubscription) {
            return Promise.resolve(mockSubscriptions);
          }
          return Promise.resolve([]);
        },
      );

      const result = await service.getRevaluationPreview(meetingId);

      expect(result.total_interest).toBe(20000);
      expect(result.total_contributions).toBe(50000);
      expect(result.details).toHaveLength(2);

      const guaranteedDetail = result.details.find((d) => d.is_guaranteed)!;
      expect(guaranteedDetail.new_value).toBe(101000); // 100000 + (100000 * 0.01)

      const regularDetail = result.details.find((d) => !d.is_guaranteed)!;
      expect(regularDetail.new_value).toBeGreaterThan(50000);
    });

    it('should handle only non-guaranteed stocks', async () => {
      meetingRepository.findOneBy.mockResolvedValue(mockMeeting as any);
      (dataSource.manager.find as jest.Mock).mockImplementation(
        (entity: any) => {
          if (entity === LedgerEntry) {
            return Promise.resolve([
              mockInterestLedgerEntry,
              mockContributionLedgerEntry,
            ]);
          }
          if (entity === Stock) {
            return Promise.resolve([mockRegularStock]);
          }
          if (entity === StockSubscription) {
            return Promise.resolve(mockSubscriptions);
          }
          return Promise.resolve([]);
        },
      );

      const result = await service.getRevaluationPreview(meetingId);
      expect(result.details.every((d) => !d.is_guaranteed)).toBe(true);
      expect(result.details[0].new_value).toBeGreaterThan(50000);
    });

    it('should handle only guaranteed stocks', async () => {
      meetingRepository.findOneBy.mockResolvedValue(mockMeeting as any);
      (dataSource.manager.find as jest.Mock).mockImplementation(
        (entity: any) => {
          if (entity === LedgerEntry) {
            return Promise.resolve([
              mockInterestLedgerEntry,
              mockContributionLedgerEntry,
            ]);
          }
          if (entity === Stock) {
            return Promise.resolve([mockGuaranteedStock]);
          }
          if (entity === StockSubscription) {
            return Promise.resolve(mockSubscriptions);
          }
          return Promise.resolve([]);
        },
      );

      const result = await service.getRevaluationPreview(meetingId);
      expect(result.details.every((d) => d.is_guaranteed)).toBe(true);
      expect(result.details[0].new_value).toBe(101000);
    });

    it('should handle interest deficit from guaranteed stocks', async () => {
      const highYieldGuaranteedStock = {
        ...mockGuaranteedStock,
        guaranteed_yield: 0.3,
      };
      meetingRepository.findOneBy.mockResolvedValue(mockMeeting as any);
      (dataSource.manager.find as jest.Mock).mockImplementation(
        (entity: any) => {
          if (entity === LedgerEntry) {
            return Promise.resolve([mockInterestLedgerEntry]);
          }
          if (entity === Stock) {
            return Promise.resolve([
              highYieldGuaranteedStock,
              mockRegularStock,
            ]);
          }
          if (entity === StockSubscription) {
            return Promise.resolve(mockSubscriptions);
          }
          return Promise.resolve([]);
        },
      );

      const result = await service.getRevaluationPreview(meetingId);
      const guaranteedDetail = result.details.find((d) => d.is_guaranteed)!;
      expect(guaranteedDetail.growth_from_interest).toBe(30000); // 100000 * 0.3

      const regularDetail = result.details.find((d) => !d.is_guaranteed)!;
      expect(regularDetail.growth_from_interest).toBeLessThan(0); // Interest available is now -10000
    });

    it('should handle zero income', async () => {
      meetingRepository.findOneBy.mockResolvedValue(mockMeeting as any);
      (dataSource.manager.find as jest.Mock).mockImplementation(
        (entity: any) => {
          if (entity === LedgerEntry) return Promise.resolve([]);
          if (entity === Stock) return Promise.resolve([mockRegularStock]);
          if (entity === StockSubscription)
            return Promise.resolve(mockSubscriptions);
          return Promise.resolve([]);
        },
      );

      const result = await service.getRevaluationPreview(meetingId);
      expect(result.total_interest).toBe(0);
      expect(result.total_contributions).toBe(0);
    });

    it('should throw NotFoundException if meeting not found', async () => {
      meetingRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getRevaluationPreview(meetingId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('executeRevaluation', () => {
    const meetingId = 'meeting-1';
    const mockPreviewResult = {
      total_contributions: 50000,
      total_interest: 20000,
      total_to_distribute: 70000,
      details: [
        {
          stock_id: 'stock-1',
          previous_value: 100,
          new_value: 110,
          growth_from_contributions: 5,
          growth_from_interest: 5,
          total_growth_per_share: 10,
        },
      ],
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOneByOrFail: jest.fn(),
        create: jest.fn((_: any, obj: unknown) => obj), // Retorna el objeto pasado, tipado como unknown
        save: jest.fn(),
        update: jest.fn(),
      },
    };

    beforeEach(() => {
      jest
        .spyOn(service, 'getRevaluationPreview')
        .mockResolvedValue(mockPreviewResult as any);
      dataSource.createQueryRunner.mockReturnValue(mockQueryRunner as any);
      mockQueryRunner.manager.findOneByOrFail.mockResolvedValue({
        id: meetingId,
        date: new Date(),
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    it('should execute a successful transaction', async () => {
      await service.executeRevaluation(meetingId);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should create all required entities', async () => {
      await service.executeRevaluation(meetingId);

      // 1. Master Operation
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ASSET_REVALUATION' }),
      );

      // 2. StockValueHistory
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.any(Object), // History Entry
      );

      // 3. Stock update
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        Stock,
        'stock-1',
        { value: 110 },
      );

      // 4. Ledger Entries
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ account_type: 'INVESTMENT_IN_STOCKS' }),
          expect.objectContaining({ account_type: 'REVALUATION_SURPLUS' }),
        ]),
      );
    });

    it('should rollback transaction on error', async () => {
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB error'));

      await expect(service.executeRevaluation(meetingId)).rejects.toThrow();

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
