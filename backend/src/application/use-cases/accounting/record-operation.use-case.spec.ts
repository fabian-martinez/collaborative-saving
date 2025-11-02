import { RecordOperationUseCase } from './record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import {
  TransactionManager,
  TransactionContext,
} from '@domain/ports/services/transaction-manager.port';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { BusinessRuleError } from '@domain/errors/business-rule.error';

describe('RecordOperationUseCase', () => {
  let useCase: RecordOperationUseCase;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let balanceValidator: OperationBalanceValidator;
  let operationSaveSpy: jest.SpyInstance;
  let ledgerEntrySaveManySpy: jest.SpyInstance;
  let transactionManagerExecuteSpy: jest.SpyInstance;

  beforeEach(() => {
    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    transactionManager = {
      execute: jest.fn(
        async <T>(
          operation: (context: TransactionContext) => Promise<T>,
        ): Promise<T> => {
          const context: TransactionContext = {
            execute: jest.fn(),
          };
          return await operation(context);
        },
      ),
    } as unknown as jest.Mocked<TransactionManager>;

    balanceValidator = new OperationBalanceValidator();

    // Create spies to avoid 'this' scoping issues
    operationSaveSpy = jest.spyOn(operationRepository, 'save');
    ledgerEntrySaveManySpy = jest.spyOn(ledgerEntryRepository, 'saveMany');
    transactionManagerExecuteSpy = jest.spyOn(transactionManager, 'execute');

    useCase = new RecordOperationUseCase(
      operationRepository,
      ledgerEntryRepository,
      transactionManager,
      balanceValidator,
    );
  });

  describe('execute', () => {
    const validDto: RecordOperationDto = {
      memberId: 'member-id',
      meetingId: 'meeting-id',
      type: 'MONTHLY_PAYMENT',
      description: 'Monthly payment',
      entries: [
        {
          accountType: 'CASH_ACCOUNT',
          amount: -1000,
          description: 'Cash received',
        },
        {
          accountType: 'STOCK_CAPITAL_ACCOUNT',
          amount: 500,
          description: 'Stock payment',
        },
        {
          accountType: 'LOANS_RECEIVABLE_ACCOUNT',
          amount: 500,
          description: 'Loan payment',
        },
      ],
    };

    it('should record operation successfully with balanced entries', async () => {
      const mockOperation = Operation.create({
        memberId: 'member-id',
        meetingId: 'meeting-id',
        type: 'MONTHLY_PAYMENT',
        description: 'Monthly payment',
      });

      const mockEntries = [
        LedgerEntry.create({
          operationId: mockOperation.id,
          accountType: 'CASH_ACCOUNT',
          amount: -1000,
        }),
        LedgerEntry.create({
          operationId: mockOperation.id,
          accountType: 'STOCK_CAPITAL_ACCOUNT',
          amount: 500,
        }),
        LedgerEntry.create({
          operationId: mockOperation.id,
          accountType: 'LOANS_RECEIVABLE_ACCOUNT',
          amount: 500,
        }),
      ];

      operationSaveSpy.mockResolvedValue(mockOperation);
      ledgerEntrySaveManySpy.mockResolvedValue(mockEntries);

      const result = await useCase.execute(validDto);

      expect(result).toEqual({
        operationId: mockOperation.id,
        ledgerEntryIds: mockEntries.map((e) => e.id),
      });

      expect(transactionManagerExecuteSpy).toHaveBeenCalledTimes(1);
      expect(operationSaveSpy).toHaveBeenCalledTimes(1);
      expect(ledgerEntrySaveManySpy).toHaveBeenCalledTimes(1);
    });

    it('should throw BusinessRuleError when entries are not balanced', async () => {
      const unbalancedDto: RecordOperationDto = {
        ...validDto,
        entries: [
          {
            accountType: 'CASH_ACCOUNT',
            amount: -1000,
          },
          {
            accountType: 'STOCK_CAPITAL_ACCOUNT',
            amount: 1500, // Does not match credit
          },
        ],
      };

      await expect(useCase.execute(unbalancedDto)).rejects.toThrow(
        BusinessRuleError,
      );
      expect(operationSaveSpy).not.toHaveBeenCalled();
      expect(ledgerEntrySaveManySpy).not.toHaveBeenCalled();
    });

    it('should handle operation without memberId', async () => {
      const dtoWithoutMember: RecordOperationDto = {
        memberId: null,
        meetingId: 'meeting-id',
        type: 'INITIAL_CASH_BALANCE',
        entries: [
          {
            accountType: 'CASH_ACCOUNT',
            amount: 5000,
          },
          {
            accountType: 'REVALUATION_SURPLUS_ACCOUNT',
            amount: -5000,
          },
        ],
      };

      const mockOperation = Operation.create({
        memberId: null,
        meetingId: 'meeting-id',
        type: 'INITIAL_CASH_BALANCE',
      });

      const mockEntries = [
        LedgerEntry.create({
          operationId: mockOperation.id,
          accountType: 'CASH_ACCOUNT',
          amount: 5000,
        }),
        LedgerEntry.create({
          operationId: mockOperation.id,
          accountType: 'REVALUATION_SURPLUS_ACCOUNT',
          amount: -5000,
        }),
      ];

      operationSaveSpy.mockResolvedValue(mockOperation);
      ledgerEntrySaveManySpy.mockResolvedValue(mockEntries);

      const result = await useCase.execute(dtoWithoutMember);

      expect(result.operationId).toBe(mockOperation.id);
      expect(operationSaveSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle entries with entity references', async () => {
      const dtoWithReferences: RecordOperationDto = {
        ...validDto,
        entries: [
          {
            accountType: 'STOCK_CAPITAL_ACCOUNT',
            amount: 1000,
            stockId: 'stock-id',
            stockSubscriptionId: 'subscription-id',
          },
          {
            accountType: 'CASH_ACCOUNT',
            amount: -1000,
          },
        ],
      };

      const mockOperation = Operation.create({
        memberId: 'member-id',
        meetingId: 'meeting-id',
        type: 'MONTHLY_PAYMENT',
      });

      const mockEntries = [
        LedgerEntry.create({
          operationId: mockOperation.id,
          accountType: 'STOCK_CAPITAL_ACCOUNT',
          amount: 1000,
          stockId: 'stock-id',
          stockSubscriptionId: 'subscription-id',
        }),
        LedgerEntry.create({
          operationId: mockOperation.id,
          accountType: 'CASH_ACCOUNT',
          amount: -1000,
        }),
      ];

      operationSaveSpy.mockResolvedValue(mockOperation);
      ledgerEntrySaveManySpy.mockResolvedValue(mockEntries);

      const result = await useCase.execute(dtoWithReferences);

      expect(result.operationId).toBe(mockOperation.id);
      expect(ledgerEntrySaveManySpy).toHaveBeenCalledTimes(1);
    });

    it('should throw error if repository save fails', async () => {
      operationSaveSpy.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(validDto)).rejects.toThrow('Database error');
      expect(transactionManagerExecuteSpy).toHaveBeenCalledTimes(1);
    });
  });
});
