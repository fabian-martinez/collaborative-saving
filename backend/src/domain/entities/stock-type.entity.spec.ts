import { StockType } from './stock-type.entity';
import { StockBehavior } from '../enums/stock-behavior.enum';

describe('StockType Entity', () => {
  it('should create a StockType instance using create method', () => {
    const data = {
      id: 'uuid-1',
      name: 'Bono',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    };

    const stockType = StockType.create(data);

    expect(stockType.id).toBe(data.id);
    expect(stockType.name).toBe(data.name);
    expect(stockType.behavior).toBe(data.behavior);
  });

  it('should be an instance of StockType', () => {
    const stockType = StockType.create({
      id: 'uuid-1',
      name: 'Bono',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
    });

    expect(stockType).toBeInstanceOf(StockType);
  });
});
