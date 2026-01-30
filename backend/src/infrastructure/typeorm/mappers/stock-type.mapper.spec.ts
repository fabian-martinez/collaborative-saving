import { StockType } from '@domain/entities/stock-type.entity';
import { StockType as StockTypeEntity } from '../entities/stock-type.entity';
import { StockBehavior } from '@domain/entities/stock.entity';
import { StockTypeMapper } from './stock-type.mapper';

describe('StockTypeMapper', () => {
  const mockId = 'type-1';

  const mockEntity: StockTypeEntity = {
    id: mockId,
    name: 'Bono',
    behavior: StockBehavior.CAPITAL_APPRECIATION,
  } as StockTypeEntity;

  const mockDomain = StockType.create({
    id: mockId,
    name: 'Bono',
    behavior: StockBehavior.CAPITAL_APPRECIATION,
  });

  it('should map persistence entity to domain entity', () => {
    const result = StockTypeMapper.toDomain(mockEntity);

    expect(result).toBeInstanceOf(StockType);
    expect(result.id).toBe(mockId);
    expect(result.name).toBe('Bono');
    expect(result.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
  });

  it('should map domain entity to persistence entity', () => {
    const result = StockTypeMapper.toPersistence(mockDomain);

    expect(result.id).toBe(mockId);
    expect(result.name).toBe('Bono');
    expect(result.behavior).toBe(StockBehavior.CAPITAL_APPRECIATION);
  });
});
