import { StockType } from '@domain/entities/stock-type.entity';
import { StockType as StockTypeEntity } from '../entities/stock-type.entity';
import { StockBehavior } from '@domain/entities/stock.entity';

export class StockTypeMapper {
  static toDomain(persistence: StockTypeEntity): StockType {
    return StockType.create({
      id: persistence.id,
      name: persistence.name,
      behavior: persistence.behavior as StockBehavior,
      isGuaranteed: persistence.isGuaranteed,
      guaranteedYield: persistence.guaranteedYield,
    });
  }

  static toPersistence(domain: StockType): Partial<StockTypeEntity> {
    return {
      id: domain.id,
      name: domain.name,
      behavior: domain.behavior as any,
      isGuaranteed: domain.isGuaranteed,
      guaranteedYield: domain.guaranteedYield,
    };
  }
}
