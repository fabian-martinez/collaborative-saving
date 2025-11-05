import { randomUUID } from 'crypto';

export enum StockSubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class StockSubscription {
  constructor(
    public readonly id: string,
    private _memberId: string,
    private _stockId: string,
    private _quantity: number,
    private _status: StockSubscriptionStatus,
    private _purchaseDate: Date,
    private _financingLoanId?: string | null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    memberId: string;
    stockId: string;
    quantity: number;
    purchaseDate?: Date;
    financingLoanId?: string | null;
  }): StockSubscription {
    const id = randomUUID();
    return new StockSubscription(
      id,
      data.memberId,
      data.stockId,
      data.quantity,
      data.quantity > 0
        ? StockSubscriptionStatus.ACTIVE
        : StockSubscriptionStatus.INACTIVE,
      data.purchaseDate || new Date(),
      data.financingLoanId || null,
    );
  }

  static fromPersistence(data: {
    id: string;
    member_id: string;
    stock_id: string;
    quantity: number | string;
    status: string;
    purchase_date: Date | string;
    financing_loan_id?: string | null;
  }): StockSubscription {
    return new StockSubscription(
      data.id,
      data.member_id,
      data.stock_id,
      Number(data.quantity),
      data.status as StockSubscriptionStatus,
      typeof data.purchase_date === 'string'
        ? new Date(data.purchase_date)
        : data.purchase_date,
      data.financing_loan_id ?? undefined,
    );
  }

  update(data: {
    quantity?: number;
    status?: StockSubscriptionStatus;
    financingLoanId?: string | null;
  }): void {
    if (data.quantity !== undefined) {
      this._quantity = data.quantity;
      // Si quantity = 0, status debe ser inactive
      if (
        this._quantity === 0 &&
        this._status !== StockSubscriptionStatus.INACTIVE
      ) {
        this._status = StockSubscriptionStatus.INACTIVE;
      }
    }
    if (data.status !== undefined) this._status = data.status;
    if (data.financingLoanId !== undefined) {
      this._financingLoanId = data.financingLoanId;
    }

    this.validateInvariants();
  }

  markAsInactive(): void {
    this._status = StockSubscriptionStatus.INACTIVE;
  }

  private validateInvariants(): void {
    if (this._quantity < 0) {
      throw new Error('StockSubscription quantity must be >= 0');
    }
    if (
      this._status !== StockSubscriptionStatus.PENDING &&
      this._status !== StockSubscriptionStatus.ACTIVE &&
      this._status !== StockSubscriptionStatus.INACTIVE
    ) {
      throw new Error(
        `Invalid StockSubscription status: ${String(this._status)}`,
      );
    }
  }

  get memberId(): string {
    return this._memberId;
  }

  get stockId(): string {
    return this._stockId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get status(): string {
    return this._status;
  }

  get purchaseDate(): Date {
    return this._purchaseDate;
  }

  get financingLoanId(): string | null | undefined {
    return this._financingLoanId;
  }

  isActive(): boolean {
    return this._status === StockSubscriptionStatus.ACTIVE;
  }
}
