import { AssetType } from './asset-type.value-object';

describe('AssetType Value Object', () => {
  describe('constructor', () => {
    it('should create AssetType with valid value', () => {
      const assetType = new AssetType('stock');
      expect(assetType.value).toBe('stock');
    });

    it('should throw error for empty string', () => {
      expect(() => new AssetType('')).toThrow('Asset type cannot be empty');
    });

    it('should throw error for whitespace only string', () => {
      expect(() => new AssetType('   ')).toThrow('Asset type cannot be empty');
    });

    it('should accept valid asset types', () => {
      const stock = new AssetType('stock');
      const savings = new AssetType('savings');
      const loan = new AssetType('loan');

      expect(stock.value).toBe('stock');
      expect(savings.value).toBe('savings');
      expect(loan.value).toBe('loan');
    });
  });

  describe('create static method', () => {
    it('should create AssetType using static factory method', () => {
      const assetType = AssetType.create('stock');
      expect(assetType).toBeInstanceOf(AssetType);
      expect(assetType.value).toBe('stock');
    });

    it('should normalize to lowercase', () => {
      const assetType = AssetType.create('STOCK');
      expect(assetType.value).toBe('stock');
    });

    it('should normalize to lowercase and trim whitespace', () => {
      const assetType = AssetType.create('  STOCK  ');
      expect(assetType.value).toBe('stock');
    });

    it('should throw error when creating with empty value', () => {
      expect(() => AssetType.create('')).toThrow('Asset type cannot be empty');
    });

    it('should throw error when creating with whitespace only', () => {
      expect(() => AssetType.create('   ')).toThrow(
        'Asset type cannot be empty',
      );
    });
  });

  describe('toString', () => {
    it('should return the value as string', () => {
      const assetType = AssetType.create('stock');
      expect(assetType.toString()).toBe('stock');
    });
  });

  describe('equals', () => {
    it('should return true for same AssetType value', () => {
      const assetType1 = AssetType.create('stock');
      const assetType2 = AssetType.create('STOCK');
      expect(assetType1.equals(assetType2)).toBe(true);
    });

    it('should return false for different AssetType values', () => {
      const assetType1 = AssetType.create('stock');
      const assetType2 = AssetType.create('savings');
      expect(assetType1.equals(assetType2)).toBe(false);
    });

    it('should handle case insensitive comparison after normalization', () => {
      const assetType1 = AssetType.create('stock');
      const assetType2 = AssetType.create('STOCK');
      expect(assetType1.equals(assetType2)).toBe(true);
    });
  });
});
