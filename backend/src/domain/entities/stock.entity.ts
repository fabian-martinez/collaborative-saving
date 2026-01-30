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
    private _isGuaranteed: boolean,
    private _guaranteedYield: number | null,
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
    isGuaranteed?: boolean;
    guaranteedYield?: number | null;
    stockTypeId?: string | null;
  }): Stock {
    const id = randomUUID();

    return new Stock(
      id,
      data.name,
      data.value,
      data.monthlyContribution,
      data.isGuaranteed || false,
      data.isGuaranteed ? data.guaranteedYield || null : null,
      new Date(),
      data.stockTypeId || null,
      null,
    );
  }

  static fromPersistence(data: {
    id: string;
    name: string;
    value: number;
    monthly_contribution: number;
    is_guaranteed: boolean;
    guaranteed_yield: number | null;
    stock_type_id?: string | null;
    created_at?: Date | string;
    deleted_at?: Date | string | null;
  }): Stock {
    return new Stock(
      data.id,
      data.name,
      Number(data.value),
      Number(data.monthly_contribution),
      data.is_guaranteed,
      data.guaranteed_yield ? Number(data.guaranteed_yield) : null,
      data.created_at
        ? typeof data.created_at === 'string'
          ? new Date(data.created_at)
          : data.created_at
        : new Date(),
      data.stock_type_id ?? null,
      data.deleted_at
        ? typeof data.deleted_at === 'string'
          ? new Date(data.deleted_at)
          : data.deleted_at
        : null,
    );
  }

  update(data: {
    name?: string;
    value?: number;
    monthlyContribution?: number;
    isGuaranteed?: boolean;
    guaranteedYield?: number | null;
    stockTypeId?: string | null;
  }): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.value !== undefined) this._value = data.value;
    if (data.monthlyContribution !== undefined)
      this._monthlyContribution = data.monthlyContribution;
    if (data.isGuaranteed !== undefined) {
      this._isGuaranteed = data.isGuaranteed;
      if (!data.isGuaranteed) {
        this._guaranteedYield = null;
      }
    }
    if (data.guaranteedYield !== undefined && this._isGuaranteed) {
      this._guaranteedYield = data.guaranteedYield;
    }
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
    if (
      this._isGuaranteed &&
      this._guaranteedYield !== null &&
      this._guaranteedYield < 0
    ) {
      throw new Error('Guaranteed yield must be >= 0 when stock is guaranteed');
    }
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Stock name is required');
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

  get isGuaranteed(): boolean {
    return this._isGuaranteed;
  }

  get guaranteedYield(): number | null {
    return this._guaranteedYield;
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
