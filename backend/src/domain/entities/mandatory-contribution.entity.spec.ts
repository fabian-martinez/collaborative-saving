import { MandatoryContribution } from './mandatory-contribution.entity';

describe('MandatoryContribution Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create MandatoryContribution with valid values', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      expect(contribution.id).toBeDefined();
      expect(contribution.assetType).toBe('stock');
      expect(contribution.value).toBe(100);
    });

    it('should create MandatoryContribution with different asset types', () => {
      const stockContrib = MandatoryContribution.create({
        assetType: 'stock',
        value: 50,
      });
      const savingsContrib = MandatoryContribution.create({
        assetType: 'savings',
        value: 75,
      });

      expect(stockContrib.assetType).toBe('stock');
      expect(savingsContrib.assetType).toBe('savings');
      expect(stockContrib.value).toBe(50);
      expect(savingsContrib.value).toBe(75);
    });

    it('should throw error for value <= 0', () => {
      expect(() =>
        MandatoryContribution.create({
          assetType: 'stock',
          value: 0,
        }),
      ).toThrow('Value must be greater than 0');
    });

    it('should throw error for negative value', () => {
      expect(() =>
        MandatoryContribution.create({
          assetType: 'stock',
          value: -10,
        }),
      ).toThrow('Value must be greater than 0');
    });

    it('should throw error for empty assetType', () => {
      expect(() =>
        MandatoryContribution.create({
          assetType: '',
          value: 100,
        }),
      ).toThrow('Asset type cannot be empty');
    });

    it('should generate unique IDs for each contribution', () => {
      const contrib1 = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });
      const contrib2 = MandatoryContribution.create({
        assetType: 'savings',
        value: 100,
      });

      expect(contrib1.id).not.toBe(contrib2.id);
    });
  });

  describe('fromPersistence static method', () => {
    it('should reconstruct MandatoryContribution from persistence data', () => {
      const contribution = MandatoryContribution.fromPersistence({
        id: mockId,
        assetType: 'stock',
        value: 100,
      });

      expect(contribution.id).toBe(mockId);
      expect(contribution.assetType).toBe('stock');
      expect(contribution.value).toBe(100);
    });

    it('should handle fromPersistence with valid data', () => {
      const contribution = MandatoryContribution.fromPersistence({
        id: mockId,
        assetType: 'savings',
        value: 50,
      });

      expect(contribution.id).toBe(mockId);
      expect(contribution.assetType).toBe('savings');
    });

    it('should throw error when fromPersistence receives invalid value', () => {
      expect(() =>
        MandatoryContribution.fromPersistence({
          id: mockId,
          assetType: 'stock',
          value: 0,
        }),
      ).toThrow('Value must be greater than 0');
    });

    it('should throw error when fromPersistence receives empty assetType', () => {
      expect(() =>
        MandatoryContribution.fromPersistence({
          id: mockId,
          assetType: '',
          value: 100,
        }),
      ).toThrow('Asset type cannot be empty');
    });
  });

  describe('update method', () => {
    it('should update both assetType and value', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      contribution.update({
        assetType: 'savings',
        value: 200,
      });

      expect(contribution.assetType).toBe('savings');
      expect(contribution.value).toBe(200);
    });

    it('should update only assetType', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      contribution.update({
        assetType: 'savings',
      });

      expect(contribution.assetType).toBe('savings');
      expect(contribution.value).toBe(100);
    });

    it('should update only value', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      contribution.update({
        value: 200,
      });

      expect(contribution.assetType).toBe('stock');
      expect(contribution.value).toBe(200);
    });

    it('should throw error when updating to value <= 0', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      expect(() =>
        contribution.update({
          value: 0,
        }),
      ).toThrow('Value must be greater than 0');
    });

    it('should throw error when updating to empty assetType', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      expect(() =>
        contribution.update({
          assetType: '',
        }),
      ).toThrow('Asset type cannot be empty');
    });
  });

  describe('getters', () => {
    it('should provide read-only access to all properties', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      expect(contribution.id).toBeDefined();
      expect(typeof contribution.id).toBe('string');
      expect(contribution.assetType).toBe('stock');
      expect(contribution.value).toBe(100);
    });

    it('should maintain immutability of readonly properties', () => {
      const contribution = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      const originalId = contribution.id;

      contribution.update({ value: 200 });

      expect(contribution.id).toBe(originalId);
    });
  });
});
