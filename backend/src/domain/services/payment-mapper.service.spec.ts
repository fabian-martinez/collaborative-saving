import { PaymentMapperService } from './payment-mapper.service';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { PaymentFilterType } from '../enums/payment-filter-type.enum';
import { OperationType } from '../enums/operation-type.enum';
import { PaymentType } from '../enums/payment-type.enum';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '../constants/account-types';

describe('PaymentMapperService', () => {
  let service: PaymentMapperService;

  beforeEach(() => {
    service = new PaymentMapperService();
  });

  describe('calculatePaymentTotalAmount', () => {
    it('should calculate total from CASH_ACCOUNT entries with positive amounts', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 500,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 300,
        }),
      ];

      // Act
      const result = service.calculatePaymentTotalAmount(entries);

      // Assert
      expect(result).toBe(1500);
    });

    it('should ignore negative amounts', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -500,
        }),
      ];

      // Act
      const result = service.calculatePaymentTotalAmount(entries);

      // Assert
      expect(result).toBe(1000);
    });

    it('should ignore non-CASH_ACCOUNT entries', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 1000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 500,
        }),
      ];

      // Act
      const result = service.calculatePaymentTotalAmount(entries);

      // Assert
      expect(result).toBe(500);
    });

    it('should return 0 when no CASH_ACCOUNT entries with positive amounts', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -1000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 500,
        }),
      ];

      // Act
      const result = service.calculatePaymentTotalAmount(entries);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when entries array is empty', () => {
      // Arrange
      const entries: LedgerEntry[] = [];

      // Act
      const result = service.calculatePaymentTotalAmount(entries);

      // Assert
      expect(result).toBe(0);
    });

    it('should filter out entries with zero amount (not possible to create)', () => {
      // Arrange
      // Note: LedgerEntry cannot have amount 0, so we test with only positive amounts
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 500,
        }),
      ];

      // Act
      const result = service.calculatePaymentTotalAmount(entries);

      // Assert
      expect(result).toBe(500);
    });
  });

  describe('calculateStockPurchaseTotalAmount', () => {
    it('should calculate total from STOCK_CAPITAL_ACCOUNT absolute amount for cash purchase', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -1000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
        }),
      ];

      // Act
      const result = service.calculateStockPurchaseTotalAmount(entries);

      // Assert
      expect(result).toBe(1000);
    });

    it('should calculate total from STOCK_CAPITAL_ACCOUNT absolute amount for 100% financed purchase', () => {
      // Arrange (100% financed, cashAmount = 0)
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -2500,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 2500,
        }),
      ];

      // Act
      const result = service.calculateStockPurchaseTotalAmount(entries);

      // Assert
      expect(result).toBe(2500);
    });

    it('should calculate total for partially financed stock purchase', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -3000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 1000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 2000,
        }),
      ];

      // Act
      const result = service.calculateStockPurchaseTotalAmount(entries);

      // Assert
      expect(result).toBe(3000);
    });

    it('should fallback to positive entries sum if STOCK_CAPITAL_ACCOUNT is not present', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 500,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 500,
        }),
      ];

      // Act
      const result = service.calculateStockPurchaseTotalAmount(entries);

      // Assert
      expect(result).toBe(1000);
    });

    it('should return 0 when entries array is empty', () => {
      expect(service.calculateStockPurchaseTotalAmount([])).toBe(0);
    });
  });

  describe('calculateStockOperationTotalAmount', () => {
    it('should calculate total from positive entries for stock transfer', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 1500,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -1500,
        }),
      ];

      // Act
      const result = service.calculateStockOperationTotalAmount(entries);

      // Assert
      expect(result).toBe(1500);
    });

    it('should calculate total from positive entries for stock loan payment', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 2000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -2000,
        }),
      ];

      // Act
      const result = service.calculateStockOperationTotalAmount(entries);

      // Assert
      expect(result).toBe(2000);
    });

    it('should calculate total from positive entries for stock exchange', () => {
      // Arrange
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 2000,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -1500,
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -500,
        }),
      ];

      // Act
      const result = service.calculateStockOperationTotalAmount(entries);

      // Assert
      expect(result).toBe(2000);
    });

    it('should return 0 when entries array is empty', () => {
      expect(service.calculateStockOperationTotalAmount([])).toBe(0);
    });
  });

  describe('mapPaymentFilterToOperationTypes', () => {
    it('should map MONTHLY_PAYMENT filter to correct operation types', () => {
      // Act
      const result = service.mapPaymentFilterToOperationTypes(
        PaymentFilterType.MONTHLY_PAYMENT,
      );

      // Assert
      expect(result).toContain(OperationType.MONTHLY_PAYMENT);
      expect(result).toContain(OperationType.MANDATORY_CONTRIBUTION);
      expect(result).toContain(OperationType.STOCK_FEE);
      expect(result).toContain(OperationType.LOAN_PAYMENT);
      expect(result).toContain(OperationType.FEE);
      expect(result).toContain(OperationType.INSURANCE_PAYMENT);
      expect(result).toHaveLength(6);
    });

    it('should map STOCK_PURCHASE filter to STOCK_PURCHASE operation type', () => {
      // Act
      const result = service.mapPaymentFilterToOperationTypes(
        PaymentFilterType.STOCK_PURCHASE,
      );

      // Assert
      expect(result).toEqual([OperationType.STOCK_PURCHASE]);
    });

    it('should map STOCK_MODIFICATION filter to STOCK_MODIFICATION operation type', () => {
      // Act
      const result = service.mapPaymentFilterToOperationTypes(
        PaymentFilterType.STOCK_MODIFICATION,
      );

      // Assert
      expect(result).toEqual([OperationType.STOCK_MODIFICATION]);
    });

    it('should map LOAN_EXTRAORDINARY_PAYMENT filter to LOAN_PAYMENT operation type', () => {
      // Act
      const result = service.mapPaymentFilterToOperationTypes(
        PaymentFilterType.LOAN_EXTRAORDINARY_PAYMENT,
      );

      // Assert
      expect(result).toEqual([OperationType.LOAN_PAYMENT]);
    });

    it('should return empty array for unknown filter type', () => {
      // Act
      const result = service.mapPaymentFilterToOperationTypes(
        'unknown' as PaymentFilterType,
      );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('mapOperationTypeToPaymentType', () => {
    it('should map MONTHLY_PAYMENT to MANDATORY_CONTRIBUTION', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        OperationType.MONTHLY_PAYMENT,
      );

      // Assert
      expect(result).toBe(PaymentType.MANDATORY_CONTRIBUTION);
    });

    it('should map MANDATORY_CONTRIBUTION to MANDATORY_CONTRIBUTION', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        OperationType.MANDATORY_CONTRIBUTION,
      );

      // Assert
      expect(result).toBe(PaymentType.MANDATORY_CONTRIBUTION);
    });

    it('should map STOCK_FEE to STOCK_FEE', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        OperationType.STOCK_FEE,
      );

      // Assert
      expect(result).toBe(PaymentType.STOCK_FEE);
    });

    it('should map LOAN_PAYMENT to LOAN_PAYMENT', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        OperationType.LOAN_PAYMENT,
      );

      // Assert
      expect(result).toBe(PaymentType.LOAN_PAYMENT);
    });

    it('should map FEE to FEE', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(OperationType.FEE);

      // Assert
      expect(result).toBe(PaymentType.FEE);
    });

    it('should map INSURANCE_PAYMENT to INSURANCE', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        OperationType.INSURANCE_PAYMENT,
      );

      // Assert
      expect(result).toBe(PaymentType.INSURANCE);
    });

    it('should map STOCK_PURCHASE to STOCK_PURCHASE', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        OperationType.STOCK_PURCHASE,
      );

      // Assert
      expect(result).toBe(PaymentType.STOCK_PURCHASE);
    });

    it('should map STOCK_MODIFICATION to STOCK_MODIFICATION', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        OperationType.STOCK_MODIFICATION,
      );

      // Assert
      expect(result).toBe(PaymentType.STOCK_MODIFICATION);
    });

    it('should return FEE as default for unknown operation type', () => {
      // Act
      const result = service.mapOperationTypeToPaymentType(
        'unknown' as OperationType,
      );

      // Assert
      expect(result).toBe(PaymentType.FEE);
    });
  });
});
