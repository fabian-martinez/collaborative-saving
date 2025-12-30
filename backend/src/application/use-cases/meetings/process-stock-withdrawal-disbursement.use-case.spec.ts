import { ProcessStockWithdrawalDisbursementUseCase } from './process-stock-withdrawal-disbursement.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { StockWithdrawalCalculator } from '@domain/services/stock-withdrawal-calculator.service';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { DisbursementPlanItemDto, DisbursementType } from '@application/dto/meetings/disbursement-plan-item.dto';
import { Stock } from '@domain/entities/stock.entity';
import { StockSubscription, StockSubscriptionStatus } from '@domain/entities/stock-subscription.entity';
import { PendingMemberPayment, PendingMemberPaymentType } from '@domain/entities/pending-member-payment.entity';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { NotFoundError } from '@domain/errors/not-found.error';

describe('ProcessStockWithdrawalDisbursementUseCase', () => {
  let useCase: ProcessStockWithdrawalDisbursementUseCase;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let stockWithdrawalCalculator: jest.Mocked<StockWithdrawalCalculator>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;

  const mockMemberId = 'member-id-1';
  const mockMeetingId = 'meeting-id-1';
  const mockStockId = 'stock-id-1';
  const mockStock = Stock.create({
    type: 'Bono',
    value: 100,
    monthlyContribution: 50,
  });

  beforeEach(() => {
    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findGuaranteed: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByStock: jest.fn(),
      findByMemberAndStock: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByAccount: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    stockWithdrawalCalculator = {
      calculateWithdrawalFIFO: jest.fn(),
      calculateWithdrawableQuantity: jest.fn(),
      hasEnoughWithdrawableQuantity: jest.fn(),
    } as unknown as jest.Mocked<StockWithdrawalCalculator>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new ProcessStockWithdrawalDisbursementUseCase(
      stockRepository,
      stockSubscriptionRepository,
      pendingMemberPaymentRepository,
      ledgerEntryRepository,
      stockWithdrawalCalculator,
      recordOperationUseCase,
    );
  });

  describe('execute', () => {
    it('should process stock withdrawal disbursement successfully', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 50,
          value: 5000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      // When amount is 0, no pending payment should be created
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 1, // Use a minimal amount for test purposes
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      expect(stockRepository.findById).toHaveBeenCalledWith(mockStockId);
      expect(stockSubscriptionRepository.findByStock).toHaveBeenCalledWith(mockStockId);
      expect(stockWithdrawalCalculator.hasEnoughWithdrawableQuantity).toHaveBeenCalled();
      expect(stockWithdrawalCalculator.calculateWithdrawalFIFO).toHaveBeenCalled();
      expect(stockSubscriptionRepository.saveMany).toHaveBeenCalled();
      expect(recordOperationUseCase.execute).toHaveBeenCalled();
    });

    it('should throw InvalidRequestError when stockId is not provided', async () => {
      // Arrange
      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
      };

      // Act & Assert
      await expect(
        useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        }),
      ).rejects.toThrow(InvalidRequestError);
    });

    it('should throw StockNotFoundException when stock not found', async () => {
      // Arrange
      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        }),
      ).rejects.toThrow(StockNotFoundException);
    });

    it('should throw BusinessRuleError when stock value is <= 0', async () => {
      // Arrange
      const invalidStock = Stock.create({
        type: 'Bono',
        value: 0,
        monthlyContribution: 50,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(invalidStock);

      // Act & Assert
      await expect(
        useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        }),
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw BusinessRuleError when not enough withdrawable quantity', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 10,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(false);
      stockWithdrawalCalculator.calculateWithdrawableQuantity.mockReturnValue(10);

      // Act & Assert
      await expect(
        useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        }),
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should limit disbursement to available cash', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 10000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 100,
          value: 10000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 5000,
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      expect(recordOperationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              amount: -5000,
            }),
          ]),
        }),
      );
      expect(pendingMemberPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
        }),
      );
    });

    it('should create pending payment when there is remaining amount', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 10000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 100,
          value: 10000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 5000,
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      expect(pendingMemberPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 5000,
        }),
      );
    });

    it('should handle existing pending payment when provided', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const mockPendingPayment = PendingMemberPayment.create({
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: 5000,
        stockId: mockStockId,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 10000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
        pendingMemberPaymentId: 'pending-payment-id-1',
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 100,
          value: 10000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      pendingMemberPaymentRepository.findById.mockResolvedValue(mockPendingPayment);
      pendingMemberPaymentRepository.save.mockResolvedValue(mockPendingPayment);

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      expect(pendingMemberPaymentRepository.findById).toHaveBeenCalledWith('pending-payment-id-1');
      expect(pendingMemberPaymentRepository.save).toHaveBeenCalledTimes(3); // Approve existing + mark as paid + create new
    });

    it('should update subscriptions correctly after withdrawal', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 50,
          value: 5000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      // When amount is 0, no pending payment should be created
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 1, // Use a minimal amount for test purposes
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      expect(stockSubscriptionRepository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            quantity: 50,
          }),
        ]),
      );
    });

    it('should not record operation when maxDisbursable is 0', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 50,
          value: 5000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 5000,
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 0,
      });

      // Assert
      expect(recordOperationUseCase.execute).not.toHaveBeenCalled();
      expect(pendingMemberPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
        }),
      );
    });

    it('should create correct ledger entries for withdrawal', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 50,
          value: 5000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      // When amount is 0, no pending payment should be created
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 1, // Use a minimal amount for test purposes
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      expect(recordOperationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: expect.arrayContaining([
              expect.objectContaining({
                accountType: 'CASH',
                amount: -5000,
              }),
              expect.objectContaining({
                accountType: 'STOCK_CAPITAL',
                amount: 5000,
              }),
          ]),
        }),
      );
    });

    it('should throw NotFoundError when subscription not found in withdrawals', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 100,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: 'non-existent-id',
          quantity: 50,
          value: 5000,
        },
      ]);

      // Act & Assert
      await expect(
        useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 5000,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should mark subscription as inactive when quantity becomes 0', async () => {
      // Arrange
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 50,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
          type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([mockSubscription]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(true);
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 50,
          value: 5000,
        },
      ]);
      stockSubscriptionRepository.saveMany.mockResolvedValue([]);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      // When amount is 0, no pending payment should be created
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 1, // Use a minimal amount for test purposes
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      expect(stockSubscriptionRepository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: StockSubscriptionStatus.INACTIVE,
          }),
        ]),
      );
    });
  });
});

