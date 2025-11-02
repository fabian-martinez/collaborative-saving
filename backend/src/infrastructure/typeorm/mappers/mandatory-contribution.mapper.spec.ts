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
      };

      const domain = MandatoryContributionMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(MandatoryContribution);
      expect(domain.id).toBe(entity.id);
      expect(domain.assetType).toBe(entity.assetType);
      expect(domain.value).toBe(entity.value);
    });

    it('should throw error for invalid value in entity', () => {
      const entity: Partial<MandatoryContributionEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        assetType: 'stock',
        value: 0, // Invalid value
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
  });
});
