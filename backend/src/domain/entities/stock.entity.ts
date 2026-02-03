import { randomUUID } from 'crypto';
import { StockBehavior } from '../enums/stock-behavior.enum';

// Re-export for backward compatibility
export { StockBehavior };

export class Stock {
  constructor(
    public readonly id: string,
    private _name: string,
    private _value: number,
    private _monthlyContribution: number,
    public readonly createdAt: Date,
    private _stockTypeId: string | null = null,
    private _deletedAt: Date | null = null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    name: string;
    value: number;
    monthlyContribution: number;
    stockTypeId: string;
  }): Stock {
    const id = randomUUID();

    return new Stock(
      id,
      data.name,
      data.value,
      data.monthlyContribution,
      new Date(),
      data.stockTypeId,
      null,
    );
  }

  static fromPersistence(data: {
    id: string;
    name: string;
    value: number;
    monthlyContribution: number;
    stockTypeId?: string | null;
    createdAt?: Date | string;
    deletedAt?: Date | string | null;
  }): Stock {
    return new Stock(
      data.id,
      data.name,
      Number(data.value),
      Number(data.monthlyContribution),
      data.createdAt
        ? typeof data.createdAt === 'string'
          ? new Date(data.createdAt)
          : data.createdAt
        : new Date(),
      data.stockTypeId,
      data.deletedAt
        ? typeof data.deletedAt === 'string'
          ? new Date(data.deletedAt)
          : data.deletedAt
        : null,
    );
  }

  update(data: {
    name?: string;
    value?: number;
    monthlyContribution?: number;
    stockTypeId?: string | null;
  }): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.value !== undefined) this._value = data.value;
    if (data.monthlyContribution !== undefined)
      this._monthlyContribution = data.monthlyContribution;
    if (data.stockTypeId !== undefined) this._stockTypeId = data.stockTypeId;

    this.validateInvariants();
  }

  markAsDeleted(): void {
    this._deletedAt = new Date();
  }

  private validateInvariants(): void {
    if (this._value < 0) {
      throw new Error('Stock value must be >= 0');
    }
    if (this._monthlyContribution < 0) {
      throw new Error('Stock monthly contribution must be >= 0');
    }
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Stock name is required');
    }
    if (!this._stockTypeId) {
      throw new Error('Stock type ID is required');
    }
  }

  get name(): string {
    return this._name;
  }

  get value(): number {
    return this._value;
  }

  get monthlyContribution(): number {
    return this._monthlyContribution;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get stockTypeId(): string | null {
    return this._stockTypeId;
  }

  isDeleted(): boolean {
    return this._deletedAt !== null;
  }
}
