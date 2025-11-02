import { randomUUID } from 'crypto';

export enum LoanTransactionType {
  DISBURSEMENT = 'disbursement',
  PRINCIPAL_PAYMENT = 'principal_payment',
  INTEREST_PAYMENT = 'interest_payment',
}

export class LoanTransactionDetail {
  constructor(
    public readonly id: string,
    private _loanId: string,
    private _transactionType: LoanTransactionType,
    private _amount: number,
    private _transactionDate: Date,
    private _notes?: string | null,
    private _operationId?: string | null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    loanId: string;
    transactionType: LoanTransactionType;
    amount: number;
    transactionDate?: Date;
    notes?: string | null;
    operationId?: string | null;
  }): LoanTransactionDetail {
    const id = randomUUID();
    return new LoanTransactionDetail(
      id,
      data.loanId,
      data.transactionType,
      data.amount,
      data.transactionDate || new Date(),
      data.notes || null,
      data.operationId || null,
    );
  }

  static fromPersistence(data: {
    id: string;
    loan_id: string;
    transaction_type: string;
    amount: number | string;
    transaction_date: Date | string;
    notes?: string | null;
    operation_id?: string | null;
  }): LoanTransactionDetail {
    return new LoanTransactionDetail(
      data.id,
      data.loan_id,
      data.transaction_type as LoanTransactionType,
      Number(data.amount),
      typeof data.transaction_date === 'string'
        ? new Date(data.transaction_date)
        : data.transaction_date,
      data.notes ?? undefined,
      data.operation_id ?? undefined,
    );
  }

  update(data: {
    amount?: number;
    transactionDate?: Date;
    notes?: string | null;
    operationId?: string | null;
  }): void {
    if (data.amount !== undefined) {
      this._amount = data.amount;
    }
    if (data.transactionDate !== undefined) {
      this._transactionDate = data.transactionDate;
    }
    if (data.notes !== undefined) {
      this._notes = data.notes;
    }
    if (data.operationId !== undefined) {
      this._operationId = data.operationId;
    }

    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (this._amount <= 0) {
      throw new Error('LoanTransactionDetail amount must be > 0');
    }
    if (
      this._transactionType !== LoanTransactionType.DISBURSEMENT &&
      this._transactionType !== LoanTransactionType.PRINCIPAL_PAYMENT &&
      this._transactionType !== LoanTransactionType.INTEREST_PAYMENT
    ) {
      throw new Error(
        `Invalid LoanTransactionDetail type: ${String(this._transactionType)}`,
      );
    }
  }

  get loanId(): string {
    return this._loanId;
  }

  get transactionType(): string {
    return this._transactionType;
  }

  get amount(): number {
    return this._amount;
  }

  get transactionDate(): Date {
    return this._transactionDate;
  }

  get notes(): string | null | undefined {
    return this._notes;
  }

  get operationId(): string | null | undefined {
    return this._operationId;
  }
}
