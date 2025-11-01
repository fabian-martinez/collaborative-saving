import { MandatoryContributionMapper } from './mandatory-contribution.mapper';
import { MandatoryContribution } from '@domain/entities/mandatory-contribution.entity';
import { MandatoryContribution as MandatoryContributionEntity } from '../entities/mandatory-contribution.entity';

describe('MandatoryContributionMapper', () => {
  describe('toDomain', () => {
    it('should map MandatoryContributionEntity to Domain MandatoryContribution', () => {
      const entity: MandatoryContributionEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'stock',
        value: 100,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      };

      const domain = MandatoryContributionMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(MandatoryContribution);
      expect(domain.id).toBe(entity.id);
      expect(domain.assetType).toBe(entity.assetType);
      expect(domain.value).toBe(entity.value);
      expect(domain.createdAt).toEqual(entity.createdAt);
      expect(domain.updatedAt).toEqual(entity.updatedAt);
    });

    it('should throw error for invalid value in entity', () => {
      const entity: Partial<MandatoryContributionEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'stock',
        value: 0, // Invalid value
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      };

      expect(() =>
        MandatoryContributionMapper.toDomain(
          entity as MandatoryContributionEntity,
        ),
      ).toThrow('Failed to map MandatoryContribution to domain');
    });

    it('should throw error for invalid assetType in entity', () => {
      const entity: Partial<MandatoryContributionEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        assetType: '', // Invalid assetType
        value: 100,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      };

      expect(() =>
        MandatoryContributionMapper.toDomain(
          entity as MandatoryContributionEntity,
        ),
      ).toThrow('Failed to map MandatoryContribution to domain');
    });
  });

  describe('toPersistence', () => {
    it('should map Domain MandatoryContribution to MandatoryContributionEntity', () => {
      const domain = MandatoryContribution.create({
        assetType: 'stock',
        value: 100,
      });

      const persistence = MandatoryContributionMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.assetType).toBe(domain.assetType);
      expect(persistence.value).toBe(domain.value);
      expect(persistence.createdAt).toEqual(domain.createdAt);
      expect(persistence.updatedAt).toEqual(domain.updatedAt);
    });

    it('should handle different asset types', () => {
      const domain = MandatoryContribution.create({
        assetType: 'savings',
        value: 50,
      });

      const persistence = MandatoryContributionMapper.toPersistence(domain);

      expect(persistence.assetType).toBe('savings');
      expect(persistence.value).toBe(50);
    });

    it('should preserve timestamps', () => {
      const domain = MandatoryContribution.fromPersistence({
        id: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'stock',
        value: 100,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      });

      const persistence = MandatoryContributionMapper.toPersistence(domain);

      expect(persistence.createdAt).toEqual(new Date('2024-01-15'));
      expect(persistence.updatedAt).toEqual(new Date('2024-01-16'));
    });
  });
});
