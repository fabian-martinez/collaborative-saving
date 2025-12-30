import { randomUUID } from 'crypto';
import { StockBehavior } from '../enums/stock-behavior.enum';

// Re-export for backward compatibility
export { StockBehavior };

export class Stock {
  constructor(
    public readonly id: string,
    private _type: string,
    private _value: number,
    private _monthlyContribution: number,
    private _isGuaranteed: boolean,
    private _guaranteedYield: number | null,
    private _behavior: StockBehavior,
    public readonly createdAt: Date,
    private _deletedAt: Date | null = null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    type: string;
    value: number;
    monthlyContribution: number;
    isGuaranteed?: boolean;
    guaranteedYield?: number | null;
    behavior?: StockBehavior;
  }): Stock {
    const id = randomUUID();
    const behavior = data.behavior || StockBehavior.CAPITAL_APPRECIATION;

    return new Stock(
      id,
      data.type,
      data.value,
      data.monthlyContribution,
      data.isGuaranteed || false,
      data.isGuaranteed ? data.guaranteedYield || null : null,
      behavior,
      new Date(),
      null,
    );
  }

  static fromPersistence(data: {
    id: string;
    type: string;
    value: number;
    monthly_contribution: number;
    is_guaranteed: boolean;
    guaranteed_yield: number | null;
    behavior: string;
    created_at?: Date | string;
    deleted_at?: Date | string | null;
  }): Stock {
    return new Stock(
      data.id,
      data.type,
      Number(data.value),
      Number(data.monthly_contribution),
      data.is_guaranteed,
      data.guaranteed_yield ? Number(data.guaranteed_yield) : null,
      data.behavior as StockBehavior,
      data.created_at
        ? typeof data.created_at === 'string'
          ? new Date(data.created_at)
          : data.created_at
        : new Date(),
      data.deleted_at
        ? typeof data.deleted_at === 'string'
          ? new Date(data.deleted_at)
          : data.deleted_at
        : null,
    );
  }

  update(data: {
    type?: string;
    value?: number;
    monthlyContribution?: number;
    isGuaranteed?: boolean;
    guaranteedYield?: number | null;
    behavior?: StockBehavior;
  }): void {
    if (data.type !== undefined) this._type = data.type;
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
    if (data.behavior !== undefined) this._behavior = data.behavior;

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
    if (!this._type || this._type.trim().length === 0) {
      throw new Error('Stock type is required');
    }
  }

  get type(): string {
    return this._type;
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

  get behavior(): StockBehavior {
    return this._behavior;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  isDeleted(): boolean {
    return this._deletedAt !== null;
  }
}
