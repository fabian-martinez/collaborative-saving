import { StockWithdrawalCalculator } from './stock-withdrawal-calculator.service';
import {
  StockSubscription,
  StockSubscriptionStatus,
} from '../entities/stock-subscription.entity';

describe('StockWithdrawalCalculator', () => {
  let calculator: StockWithdrawalCalculator;

  beforeEach(() => {
    calculator = new StockWithdrawalCalculator();
  });

  describe('calculateWithdrawalFIFO', () => {
    it('should return empty array when requested quantity is 0', () => {
      const subscriptions: StockSubscription[] = [];
      const result = calculator.calculateWithdrawalFIFO(subscriptions, 0, 100);
      expect(result).toEqual([]);
    });

    it('should throw error when stock value is <= 0', () => {
      const subscriptions: StockSubscription[] = [];
      expect(() => {
        calculator.calculateWithdrawalFIFO(subscriptions, 10, 0);
      }).toThrow('Stock value must be > 0');

      expect(() => {
        calculator.calculateWithdrawalFIFO(subscriptions, 10, -10);
      }).toThrow('Stock value must be > 0');
    });

    it('should filter out subscriptions with financing loan', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
          financingLoanId: 'loan1', // Con préstamo
        }),
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 5,
          financingLoanId: null, // Sin préstamo
        }),
      ];

      const result = calculator.calculateWithdrawalFIFO(subscriptions, 5, 100);

      expect(result).toHaveLength(1);
      expect(result[0].subscriptionId).toBe(subscriptions[1].id);
      expect(result[0].quantity).toBe(5);
      expect(result[0].value).toBe(500);
    });

    it('should filter out inactive subscriptions', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
        }),
      ];

      subscriptions[0].update({ status: StockSubscriptionStatus.INACTIVE });

      expect(() => {
        calculator.calculateWithdrawalFIFO(subscriptions, 5, 100);
      }).toThrow();
    });

    it('should order by purchase date (FIFO - oldest first)', () => {
      const subscription1 = StockSubscription.create({
        memberId: 'member1',
        stockId: 'stock1',
        quantity: 5,
        purchaseDate: new Date('2024-02-01'), // Más reciente
      });
      subscription1.update({ financingLoanId: null });

      const subscription2 = StockSubscription.create({
        memberId: 'member1',
        stockId: 'stock1',
        quantity: 10,
        purchaseDate: new Date('2024-01-01'), // Más antigua
      });
      subscription2.update({ financingLoanId: null });

      const subscriptions = [subscription1, subscription2];

      const result = calculator.calculateWithdrawalFIFO(
        subscriptions,
        12, // Solicitar más que una sola suscripción
        100,
      );

      expect(result).toHaveLength(2);
      expect(result[0].subscriptionId).toBe(subscription2.id); // Más antigua primero
      expect(result[0].quantity).toBe(10);
      expect(result[1].subscriptionId).toBe(subscription1.id);
      expect(result[1].quantity).toBe(2); // Solo 2 de las 5 disponibles
    });

    it('should throw error when requested quantity exceeds available', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 5,
        }),
      ];

      expect(() => {
        calculator.calculateWithdrawalFIFO(subscriptions, 10, 100);
      }).toThrow(
        'Requested quantity (10) exceeds available withdrawable quantity (5)',
      );
    });

    it('should calculate withdrawals correctly across multiple subscriptions', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 3,
          purchaseDate: new Date('2024-01-01'),
        }),
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 5,
          purchaseDate: new Date('2024-01-15'),
        }),
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 2,
          purchaseDate: new Date('2024-02-01'),
        }),
      ];

      const result = calculator.calculateWithdrawalFIFO(
        subscriptions,
        7, // Retirar 7 acciones
        100, // Valor unitario 100
      );

      expect(result).toHaveLength(2);
      expect(result[0].subscriptionId).toBe(subscriptions[0].id);
      expect(result[0].quantity).toBe(3);
      expect(result[0].value).toBe(300);
      expect(result[1].subscriptionId).toBe(subscriptions[1].id);
      expect(result[1].quantity).toBe(4); // Solo 4 de las 5 disponibles
      expect(result[1].value).toBe(400);
    });

    it('should calculate correct value for each withdrawal', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
          purchaseDate: new Date('2024-01-01'),
        }),
      ];

      const result = calculator.calculateWithdrawalFIFO(
        subscriptions,
        5,
        150, // Valor unitario 150
      );

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(5);
      expect(result[0].value).toBe(750); // 5 * 150
    });
  });

  describe('calculateWithdrawableQuantity', () => {
    it('should return 0 when no subscriptions', () => {
      const result = calculator.calculateWithdrawableQuantity([]);
      expect(result).toBe(0);
    });

    it('should sum only withdrawable subscriptions (no financing loan, active, quantity > 0)', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
          financingLoanId: null,
        }),
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 5,
          financingLoanId: 'loan1', // Con préstamo - no cuenta
        }),
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 3,
          financingLoanId: null,
        }),
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 0, // Cantidad 0 - no cuenta
          financingLoanId: null,
        }),
      ];

      const result = calculator.calculateWithdrawableQuantity(subscriptions);
      expect(result).toBe(13); // 10 + 3
    });

    it('should exclude inactive subscriptions', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
        }),
      ];

      subscriptions[0].update({ status: StockSubscriptionStatus.INACTIVE });

      const result = calculator.calculateWithdrawableQuantity(subscriptions);
      expect(result).toBe(0);
    });
  });

  describe('hasEnoughWithdrawableQuantity', () => {
    it('should return true when enough quantity available', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
        }),
      ];

      const result = calculator.hasEnoughWithdrawableQuantity(subscriptions, 5);
      expect(result).toBe(true);
    });

    it('should return true when exact quantity available', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
        }),
      ];

      const result = calculator.hasEnoughWithdrawableQuantity(
        subscriptions,
        10,
      );
      expect(result).toBe(true);
    });

    it('should return false when not enough quantity available', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 5,
        }),
      ];

      const result = calculator.hasEnoughWithdrawableQuantity(
        subscriptions,
        10,
      );
      expect(result).toBe(false);
    });

    it('should exclude subscriptions with financing loan', () => {
      const subscriptions = [
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 10,
          financingLoanId: 'loan1', // Con préstamo - no cuenta
        }),
        StockSubscription.create({
          memberId: 'member1',
          stockId: 'stock1',
          quantity: 5,
          financingLoanId: null,
        }),
      ];

      const result = calculator.hasEnoughWithdrawableQuantity(
        subscriptions,
        10, // Solicita 10, pero solo hay 5 disponibles
      );
      expect(result).toBe(false);
    });
  });
});
