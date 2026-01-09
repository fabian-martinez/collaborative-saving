import { ProcessStockWithdrawalDisbursementUseCase } from './process-stock-withdrawal-disbursement.use-case';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { StockWithdrawalCalculator } from '@domain/services/stock-withdrawal-calculator.service';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import { Stock } from '@domain/entities/stock.entity';
import {
  StockSubscription,
  StockSubscriptionStatus,
} from '@domain/entities/stock-subscription.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      const findStockByIdSpy = jest.spyOn(stockRepository, 'findById');
      const findByStockSpy = jest.spyOn(
        stockSubscriptionRepository,
        'findByStock',
      );
      const hasEnoughQtySpy = jest.spyOn(
        stockWithdrawalCalculator,
        'hasEnoughWithdrawableQuantity',
      );
      const calcWithdrawalSpy = jest.spyOn(
        stockWithdrawalCalculator,
        'calculateWithdrawalFIFO',
      );
      const saveManySubsSpy = jest.spyOn(
        stockSubscriptionRepository,
        'saveMany',
      );
      const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');

      expect(findStockByIdSpy).toHaveBeenCalledWith(mockStockId);
      expect(findByStockSpy).toHaveBeenCalledWith(mockStock.id);
      expect(hasEnoughQtySpy).toHaveBeenCalled();
      expect(calcWithdrawalSpy).toHaveBeenCalled();
      expect(saveManySubsSpy).toHaveBeenCalled();
      expect(executeOpSpy).toHaveBeenCalled();
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        false,
      );
      stockWithdrawalCalculator.calculateWithdrawableQuantity.mockReturnValue(
        10,
      );

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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
      const savePaymentSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');

      expect(executeOpSpy).toHaveBeenCalled();
      const callArgs = executeOpSpy.mock.calls[0][0];
      expect(callArgs.entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            amount: -5000,
          }),
        ]),
      );
      expect(savePaymentSpy).toHaveBeenCalledWith(
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      const savePaymentSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
      expect(savePaymentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 5000,
        }),
      );
    });

    it('should use stockWithdrawalQuantity to calculate total requested amount when provided', async () => {
      // Arrange
      // Escenario: Usuario quiere retirar 3 acciones × 100 = 300, pero solo hay 150 disponibles
      const mockSubscription = StockSubscription.create({
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 3,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
        type: DisbursementType.WITHDRAWAL,
        amount: 150, // Monto proporcional a desembolsar (del frontend)
        disbursementStockRequest: {
          stockId: mockStockId,
          stockWithdrawalQuantity: 3, // Cantidad de acciones a retirar
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
      // Debe retirar 3 acciones completas (no 1.5)
      stockWithdrawalCalculator.calculateWithdrawalFIFO.mockReturnValue([
        {
          subscriptionId: mockSubscription.id,
          quantity: 3,
          value: 300, // 3 * 100
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
          amount: 150,
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 150, // Solo hay 150 disponibles
      });

      // Assert
      const hasEnoughQtySpy = jest.spyOn(
        stockWithdrawalCalculator,
        'hasEnoughWithdrawableQuantity',
      );
      const calcWithdrawalSpy = jest.spyOn(
        stockWithdrawalCalculator,
        'calculateWithdrawalFIFO',
      );
      const saveManySubsSpy = jest.spyOn(
        stockSubscriptionRepository,
        'saveMany',
      );
      const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
      const savePaymentSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');

      // Debe validar que hay 3 acciones disponibles (no 1.5)
      expect(hasEnoughQtySpy).toHaveBeenCalledWith(
        [mockSubscription],
        3, // Cantidad solicitada debe ser 3, no 1.5
      );

      // Debe calcular retiro de 3 acciones (no 1.5)
      expect(calcWithdrawalSpy).toHaveBeenCalledWith(
        [mockSubscription],
        3, // Cantidad solicitada debe ser 3, no 1.5
        100, // stockValue
      );

      // Debe actualizar suscripción reduciendo 3 acciones (dejando 0, inactiva)
      expect(saveManySubsSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            quantity: 0, // 3 - 3 = 0
            status: StockSubscriptionStatus.INACTIVE,
          }),
        ]),
      );

      // Debe registrar operación contable por 150 (lo disponible)
      expect(executeOpSpy).toHaveBeenCalled();
      const callArgs = executeOpSpy.mock.calls[0][0];
      expect(callArgs.entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            amount: -150, // Desembolso de efectivo
          }),
        ]),
      );

      // Debe crear pago pendiente por 150 (300 - 150)
      expect(savePaymentSpy).toHaveBeenCalled();
      const savedPayment = savePaymentSpy.mock.calls[0][0];
      expect(savedPayment.type).toBe(PendingMemberPaymentType.STOCK_WITHDRAWAL);
      expect(savedPayment.amount).toBe(150); // Monto pendiente = 300 (total) - 150 (desembolsado)
      expect(savedPayment.stockId).toBe(mockStock.id); // Se usa stock.id del objeto stock
    });

    it('should handle existing pending payment when provided', async () => {
      // Arrange
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
        amount: 5000, // Should not exceed pendingPayment.amount
        disbursementStockRequest: {
          stockId: mockStockId,
        },
        pendingMemberPaymentId: 'pending-payment-id-1',
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      pendingMemberPaymentRepository.findById.mockResolvedValue(
        mockPendingPayment,
      );
      pendingMemberPaymentRepository.save.mockResolvedValue(mockPendingPayment);

      // Act - Full payment of pending payment
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      const findByIdSpy = jest.spyOn(
        pendingMemberPaymentRepository,
        'findById',
      );
      const saveSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
      const findByStockSpy = jest.spyOn(
        stockSubscriptionRepository,
        'findByStock',
      );
      const hasEnoughSpy = jest.spyOn(
        stockWithdrawalCalculator,
        'hasEnoughWithdrawableQuantity',
      );
      const calculateFIFOSpy = jest.spyOn(
        stockWithdrawalCalculator,
        'calculateWithdrawalFIFO',
      );

      expect(findByIdSpy).toHaveBeenCalledWith('pending-payment-id-1');
      // Should call save 2 times: approve pending (if needed) + mark as paid (no remaining amount)
      expect(saveSpy).toHaveBeenCalledTimes(2);
      // Should NOT call subscription-related methods (this is a pending payment, not a real withdrawal)
      expect(findByStockSpy).not.toHaveBeenCalled();
      expect(hasEnoughSpy).not.toHaveBeenCalled();
      expect(calculateFIFOSpy).not.toHaveBeenCalled();
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      const saveManySubsSpy = jest.spyOn(
        stockSubscriptionRepository,
        'saveMany',
      );
      expect(saveManySubsSpy).toHaveBeenCalledWith(
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
      const savePaymentSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
      expect(executeOpSpy).not.toHaveBeenCalled();
      expect(savePaymentSpy).toHaveBeenCalledWith(
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      const executeOpSpy = jest.spyOn(recordOperationUseCase, 'execute');
      expect(executeOpSpy).toHaveBeenCalled();
      const callArgs = executeOpSpy.mock.calls[0][0];
      expect(callArgs.entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            accountType: 'CASH',
            amount: -5000,
          }),
          expect.objectContaining({
            accountType: 'STOCK_CAPITAL',
            amount: 5000,
          }),
        ]),
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      stockSubscriptionRepository.findByStock.mockResolvedValue([
        mockSubscription,
      ]);
      stockWithdrawalCalculator.hasEnoughWithdrawableQuantity.mockReturnValue(
        true,
      );
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
      const saveManySubsSpy = jest.spyOn(
        stockSubscriptionRepository,
        'saveMany',
      );
      expect(saveManySubsSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: StockSubscriptionStatus.INACTIVE,
          }),
        ]),
      );
    });

    it('should process pending payment disbursement without modifying subscriptions', async () => {
      // Arrange
      const pendingPayment = PendingMemberPayment.create({
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: 5000,
        stockId: mockStockId,
        stockSubscriptionId: 'subscription-id-1',
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
        type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        pendingMemberPaymentId: pendingPayment.id,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      pendingMemberPaymentRepository.findById.mockResolvedValue(pendingPayment);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 5000,
      });

      // Assert
      const findByStockSpy = jest.spyOn(
        stockSubscriptionRepository,
        'findByStock',
      );
      const hasEnoughSpy = jest.spyOn(
        stockWithdrawalCalculator,
        'hasEnoughWithdrawableQuantity',
      );
      const calculateFIFOSpy = jest.spyOn(
        stockWithdrawalCalculator,
        'calculateWithdrawalFIFO',
      );
      const saveManySpy = jest.spyOn(stockSubscriptionRepository, 'saveMany');
      const findByIdSpy = jest.spyOn(
        pendingMemberPaymentRepository,
        'findById',
      );
      const saveSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
      const executeSpy = jest.spyOn(recordOperationUseCase, 'execute');

      // Should NOT call findByStock (no subscription lookup)
      expect(findByStockSpy).not.toHaveBeenCalled();
      // Should NOT call withdrawal calculator
      expect(hasEnoughSpy).not.toHaveBeenCalled();
      expect(calculateFIFOSpy).not.toHaveBeenCalled();
      // Should NOT modify subscriptions
      expect(saveManySpy).not.toHaveBeenCalled();
      // Should process the pending payment
      expect(findByIdSpy).toHaveBeenCalledWith(pendingPayment.id);
      expect(saveSpy).toHaveBeenCalled();
      // Should record operation
      expect(executeSpy).toHaveBeenCalled();
    });

    it('should create new pending payment when partial disbursement of pending payment', async () => {
      // Arrange
      const pendingPayment = PendingMemberPayment.create({
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: 5000,
        stockId: mockStockId,
        stockSubscriptionId: 'subscription-id-1',
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
        type: DisbursementType.WITHDRAWAL,
        amount: 5000,
        pendingMemberPaymentId: pendingPayment.id,
        disbursementStockRequest: {
          stockId: mockStockId,
        },
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      pendingMemberPaymentRepository.findById.mockResolvedValue(pendingPayment);
      recordOperationUseCase.execute.mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: [],
      });
      pendingMemberPaymentRepository.save.mockResolvedValue(
        PendingMemberPayment.create({
          memberId: mockMemberId,
          meetingId: mockMeetingId,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
          amount: 2000,
          stockId: mockStockId,
        }),
      );

      // Act
      await useCase.execute({
        item,
        meetingId: mockMeetingId,
        availableCash: 3000, // Less than requested
      });

      // Assert
      const saveSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
      // Should approve pending payment, mark as paid, and create new one
      expect(saveSpy).toHaveBeenCalledTimes(3);
      // Should create new pending payment for remaining amount (2000 = 5000 - 3000)
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2000,
          type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        }),
      );
    });

    it('should throw BusinessRuleError when item amount exceeds pending payment amount', async () => {
      // Arrange
      const mockPendingPayment = PendingMemberPayment.create({
        memberId: mockMemberId,
        meetingId: mockMeetingId,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: 300, // Pending payment amount
        stockId: mockStockId,
      });

      const item: DisbursementPlanItemDto = {
        memberId: mockMemberId,
        type: DisbursementType.WITHDRAWAL,
        amount: 500, // Exceeds pending payment amount
        disbursementStockRequest: {
          stockId: mockStockId,
        },
        pendingMemberPaymentId: 'pending-payment-id-1',
      };

      stockRepository.findById.mockResolvedValue(mockStock);
      pendingMemberPaymentRepository.findById.mockResolvedValue(
        mockPendingPayment,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 500,
        }),
      ).rejects.toThrow(BusinessRuleError);
      await expect(
        useCase.execute({
          item,
          meetingId: mockMeetingId,
          availableCash: 500,
        }),
      ).rejects.toThrow(
        'El monto del desembolso (500) excede el monto del pago pendiente (300)',
      );
    });
  });
});
