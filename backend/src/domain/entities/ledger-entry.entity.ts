import { randomUUID } from 'crypto';
import { AccountType, ALL_ACCOUNT_TYPES } from '../constants/account-types';

export class LedgerEntry {
  constructor(
    public readonly id: string,
    private _operationId: string,
    private _accountType: AccountType,
    private _amount: number,
    private _createdAt: Date,
    private _description?: string | null,
    private _loanId?: string | null,
    private _stockId?: string | null,
    private _mandatoryContributionId?: string | null,
    private _stockSubscriptionId?: string | null,
  ) {
    // Redondear estrictamente a 2 decimales para evitar discrepancias entre JS y Postgres
    this._amount = Math.round(this._amount * 100) / 100;
    this.validateInvariants();
  }

  static create(data: {
    operationId: string;
    accountType: AccountType;
    amount: number;
    description?: string | null;
    loanId?: string | null;
    stockId?: string | null;
    mandatoryContributionId?: string | null;
    stockSubscriptionId?: string | null;
  }): LedgerEntry {
    const id = randomUUID();
    return new LedgerEntry(
      id,
      data.operationId,
      data.accountType,
      data.amount,
      new Date(),
      data.description || null,
      data.loanId || null,
      data.stockId || null,
      data.mandatoryContributionId || null,
      data.stockSubscriptionId || null,
    );
  }

  static fromPersistence(data: {
    id: string;
    operation_id: string;
    account_type: string;
    amount: number | string;
    created_at: Date | string;
    description?: string | null;
    loan_id?: string | null;
    stock_id?: string | null;
    mandatory_contribution_id?: string | null;
    stock_subscription_id?: string | null;
  }): LedgerEntry {
    // Validate account type
    if (!ALL_ACCOUNT_TYPES.includes(data.account_type as AccountType)) {
      throw new Error(`Invalid account type: ${data.account_type}`);
    }

    return new LedgerEntry(
      data.id,
      data.operation_id,
      data.account_type as AccountType,
      Number(data.amount),
      typeof data.created_at === 'string'
        ? new Date(data.created_at)
        : data.created_at,
      data.description ?? undefined,
      data.loan_id ?? undefined,
      data.stock_id ?? undefined,
      data.mandatory_contribution_id ?? undefined,
      data.stock_subscription_id ?? undefined,
    );
  }

  update(data: {
    accountType?: AccountType;
    amount?: number;
    description?: string | null;
  }): void {
    if (data.accountType !== undefined) {
      // Validate account type
      if (!ALL_ACCOUNT_TYPES.includes(data.accountType)) {
        throw new Error(`Invalid account type: ${data.accountType}`);
      }
      this._accountType = data.accountType;
    }
    if (data.amount !== undefined) {
      this._amount = data.amount;
    }
    if (data.description !== undefined) {
      this._description = data.description;
    }

    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (this._amount === 0) {
      throw new Error('LedgerEntry amount cannot be 0');
    }
    if (!this._accountType) {
      throw new Error('LedgerEntry accountType is required');
    }
    if (!ALL_ACCOUNT_TYPES.includes(this._accountType)) {
      throw new Error(`Invalid account type: ${this._accountType}`);
    }
    if (!this._operationId) {
      throw new Error('LedgerEntry operationId is required');
    }
    // Solo una referencia de entidad afectada por asiento
    // Nota: permitimos 0 referencias (asientos genéricos) o 1 referencia
    // No validamos múltiples referencias aquí porque podría ser válido en algunos casos
  }

  get operationId(): string {
    return this._operationId;
  }

  get accountType(): AccountType {
    return this._accountType;
  }

  get amount(): number {
    return this._amount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get description(): string | null | undefined {
    return this._description;
  }

  get loanId(): string | null | undefined {
    return this._loanId;
  }

  get stockId(): string | null | undefined {
    return this._stockId;
  }

  get mandatoryContributionId(): string | null | undefined {
    return this._mandatoryContributionId;
  }

  get stockSubscriptionId(): string | null | undefined {
    return this._stockSubscriptionId;
  }

  isDebit(): boolean {
    return this._amount > 0;
  }

  isCredit(): boolean {
    return this._amount < 0;
  }
}
