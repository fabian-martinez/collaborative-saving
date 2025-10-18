import { faker } from '@faker-js/faker';
import { Stock } from '../../src/stocks/entities/stock.entity';

export class StockFactory {
  static create(overrides: Partial<Stock> = {}): Stock {
    return {
      id: faker.string.uuid(),
      type: 'REGULAR',
      value: faker.number.float({ min: 50, max: 1000, fractionDigits: 2 }),
      monthly_contribution: faker.number.float({
        min: 10,
        max: 100,
        fractionDigits: 2,
      }),
      is_guaranteed: false,
      guaranteed_yield: null,
      behavior: 'CAPITAL_APPRECIATION',
      value_history: [],
      deleted_at: null,
      ...overrides,
    } as Stock;
  }

  static createMany(count: number, overrides: Partial<Stock> = {}): Stock[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createRegular(overrides: Partial<Stock> = {}): Stock {
    return this.create({
      type: 'REGULAR',
      is_guaranteed: false,
      guaranteed_yield: null,
      ...overrides,
    });
  }

  static createGuaranteed(overrides: Partial<Stock> = {}): Stock {
    return this.create({
      type: 'GUARANTEED',
      is_guaranteed: true,
      guaranteed_yield: faker.number.float({
        min: 0.01,
        max: 0.1,
        fractionDigits: 4,
      }),
      ...overrides,
    });
  }

  static createHighValue(overrides: Partial<Stock> = {}): Stock {
    return this.create({
      value: faker.number.float({ min: 500, max: 2000, fractionDigits: 2 }),
      ...overrides,
    });
  }

  static createLowValue(overrides: Partial<Stock> = {}): Stock {
    return this.create({
      value: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      ...overrides,
    });
  }
}
