import { StockBehavior } from './stock.entity';

export class StockType {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly behavior: StockBehavior,
  ) {}

  static create(data: {
    id: string;
    name: string;
    behavior: StockBehavior;
  }): StockType {
    return new StockType(data.id, data.name, data.behavior);
  }
}
