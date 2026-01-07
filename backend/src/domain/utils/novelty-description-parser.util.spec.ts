import {
  parseAffectedPaymentType,
  removeAffectedPrefix,
  hasAffectedPrefix,
} from './novelty-description-parser.util';
import { PaymentType } from '../enums/payment-type.enum';

describe('NoveltyDescriptionParser', () => {
  describe('parseAffectedPaymentType', () => {
    it('should extract affected payment type from description with prefix', () => {
      const description = '[AFFECTED:fee]Novedad en Multa/otro pago: 50.00';
      const result = parseAffectedPaymentType(description);
      expect(result).toBe(PaymentType.FEE);
    });

    it('should extract mandatory_contribution type', () => {
      const description =
        '[AFFECTED:mandatory_contribution]Novedad en Aporte obligatorio: 100.00';
      const result = parseAffectedPaymentType(description);
      expect(result).toBe(PaymentType.MANDATORY_CONTRIBUTION);
    });

    it('should extract stock_fee type', () => {
      const description =
        '[AFFECTED:stock_fee]Novedad en Cuota de acciones: 75.00';
      const result = parseAffectedPaymentType(description);
      expect(result).toBe(PaymentType.STOCK_FEE);
    });

    it('should extract insurance type', () => {
      const description =
        '[AFFECTED:insurance]Novedad en Seguro de deuda: 25.00';
      const result = parseAffectedPaymentType(description);
      expect(result).toBe(PaymentType.INSURANCE);
    });

    it('should return null when description has no prefix', () => {
      const description = 'Novedad/descuento: 50.00';
      const result = parseAffectedPaymentType(description);
      expect(result).toBeNull();
    });

    it('should return null when description is null', () => {
      const result = parseAffectedPaymentType(null);
      expect(result).toBeNull();
    });

    it('should return null when description is undefined', () => {
      const result = parseAffectedPaymentType(undefined);
      expect(result).toBeNull();
    });

    it('should return null when prefix contains invalid payment type', () => {
      const description = '[AFFECTED:invalid_type]Some description';
      const result = parseAffectedPaymentType(description);
      expect(result).toBeNull();
    });

    it('should return null when prefix is not at the start', () => {
      const description = 'Some text [AFFECTED:fee] more text';
      const result = parseAffectedPaymentType(description);
      expect(result).toBeNull();
    });
  });

  describe('removeAffectedPrefix', () => {
    it('should remove prefix from description', () => {
      const description = '[AFFECTED:fee]Novedad en Multa/otro pago: 50.00';
      const result = removeAffectedPrefix(description);
      expect(result).toBe('Novedad en Multa/otro pago: 50.00');
    });

    it('should return original description when no prefix exists', () => {
      const description = 'Novedad/descuento: 50.00';
      const result = removeAffectedPrefix(description);
      expect(result).toBe('Novedad/descuento: 50.00');
    });

    it('should return empty string when description is null', () => {
      const result = removeAffectedPrefix(null);
      expect(result).toBe('');
    });

    it('should return empty string when description is undefined', () => {
      const result = removeAffectedPrefix(undefined);
      expect(result).toBe('');
    });

    it('should only remove prefix at the start', () => {
      const description = '[AFFECTED:fee]Text with [AFFECTED:fee] in middle';
      const result = removeAffectedPrefix(description);
      expect(result).toBe('Text with [AFFECTED:fee] in middle');
    });
  });

  describe('hasAffectedPrefix', () => {
    it('should return true when description has prefix', () => {
      const description = '[AFFECTED:fee]Novedad en Multa/otro pago: 50.00';
      const result = hasAffectedPrefix(description);
      expect(result).toBe(true);
    });

    it('should return false when description has no prefix', () => {
      const description = 'Novedad/descuento: 50.00';
      const result = hasAffectedPrefix(description);
      expect(result).toBe(false);
    });

    it('should return false when description is null', () => {
      const result = hasAffectedPrefix(null);
      expect(result).toBe(false);
    });

    it('should return false when description is undefined', () => {
      const result = hasAffectedPrefix(undefined);
      expect(result).toBe(false);
    });

    it('should return false when prefix is not at the start', () => {
      const description = 'Some text [AFFECTED:fee] more text';
      const result = hasAffectedPrefix(description);
      expect(result).toBe(false);
    });
  });
});
