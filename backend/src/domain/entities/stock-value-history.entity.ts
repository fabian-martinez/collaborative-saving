import { randomUUID } from 'crypto';

export class StockValueHistory {
  constructor(
    public readonly id: string,
    private _stockId: string,
    private _operationId: string,
    private _previousValue: number,
    private _growthFromContributions: number,
    private _growthFromInterest: number,
    private _totalGrowthPerShare: number,
    private _newValue: number,
    private _createdAt: Date,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    stockId: string;
    operationId: string;
    previousValue: number;
    growthFromContributions: number;
    growthFromInterest: number;
    totalGrowthPerShare: number;
    newValue: number;
  }): StockValueHistory {
    const id = randomUUID();
    return new StockValueHistory(
      id,
      data.stockId,
      data.operationId,
      data.previousValue,
      data.growthFromContributions,
      data.growthFromInterest,
      data.totalGrowthPerShare,
      data.newValue,
      new Date(),
    );
  }

  static fromPersistence(data: {
    id: string;
    stock_id: string;
    operation_id: string;
    previous_value: number | string;
    growth_from_contributions: number | string;
    growth_from_interest: number | string;
    total_growth_per_share: number | string;
    new_value: number | string;
    created_at: Date | string;
  }): StockValueHistory {
    return new StockValueHistory(
      data.id,
      data.stock_id,
      data.operation_id,
      Number(data.previous_value),
      Number(data.growth_from_contributions),
      Number(data.growth_from_interest),
      Number(data.total_growth_per_share),
      Number(data.new_value),
      typeof data.created_at === 'string'
        ? new Date(data.created_at)
        : data.created_at,
    );
  }

  private validateInvariants(): void {
    if (this._previousValue < 0 || this._newValue < 0) {
      throw new Error('Stock value history values must be >= 0');
    }
    if (!this._stockId) {
      throw new Error('StockValueHistory stockId is required');
    }
    if (!this._operationId) {
      throw new Error('StockValueHistory operationId is required');
    }
    // Validar que new_value = previous_value + growth_from_contributions + growth_from_interest (aproximadamente)
    const expectedNewValue =
      this._previousValue +
      this._growthFromContributions +
      this._growthFromInterest;
    // Permitir pequeña diferencia por redondeo
    if (Math.abs(this._newValue - expectedNewValue) > 0.01) {
      throw new Error(
        `StockValueHistory new_value must equal previous_value + growth_from_contributions + growth_from_interest`,
      );
    }
  }

  get stockId(): string {
    return this._stockId;
  }

  get operationId(): string {
    return this._operationId;
  }

  get previousValue(): number {
    return this._previousValue;
  }

  get growthFromContributions(): number {
    return this._growthFromContributions;
  }

  get growthFromInterest(): number {
    return this._growthFromInterest;
  }

  get totalGrowthPerShare(): number {
    return this._totalGrowthPerShare;
  }

  get newValue(): number {
    return this._newValue;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
