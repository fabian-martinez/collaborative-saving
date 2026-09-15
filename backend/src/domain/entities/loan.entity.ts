import { randomUUID } from 'crypto';
import { LoanStatus } from '../enums/loan-status.enum';

// Re-export for backward compatibility
export { LoanStatus };

export class Loan {
  constructor(
    public readonly id: string,
    private _memberId: string,
    private _loanType: string,
    private _approvedAmount: number,
    private _disbursedAmount: number,
    private _outstandingBalance: number,
    private _monthlyPaymentAmount: number,
    private _interestRate: number,
    private _term: number,
    private _status: LoanStatus,
    private _creationDate: Date,
    private _guaranteedStockId?: string | null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    memberId: string;
    loanType: string;
    approvedAmount: number;
    monthlyPaymentAmount: number;
    interestRate: number;
    term: number;
    guaranteedStockId?: string | null;
  }): Loan {
    const id = randomUUID();
    return new Loan(
      id,
      data.memberId,
      data.loanType,
      data.approvedAmount,
      0, // disbursedAmount
      data.approvedAmount, // outstandingBalance starts at approvedAmount
      data.monthlyPaymentAmount,
      data.interestRate,
      data.term,
      LoanStatus.PENDING,
      new Date(), // creationDate
      data.guaranteedStockId || null,
    );
  }

  static fromPersistence(data: {
    id: string;
    member_id: string;
    loan_type: string;
    approved_amount: number | string;
    disbursed_amount: number | string;
    outstanding_balance: number | string;
    monthly_payment_amount: number | string;
    interest_rate: number | string;
    term: number | string;
    status: string;
    creation_date: Date | string;
    guaranteed_stock_id?: string | null;
  }): Loan {
    return new Loan(
      data.id,
      data.member_id,
      data.loan_type,
      Number(data.approved_amount),
      Number(data.disbursed_amount),
      Number(data.outstanding_balance),
      Number(data.monthly_payment_amount),
      Number(data.interest_rate),
      Number(data.term),
      data.status as LoanStatus,
      typeof data.creation_date === 'string'
        ? new Date(data.creation_date)
        : data.creation_date,
      data.guaranteed_stock_id ?? undefined,
    );
  }

  update(data: {
    disbursedAmount?: number;
    outstandingBalance?: number;
    status?: LoanStatus;
  }): void {
    if (data.disbursedAmount !== undefined) {
      this._disbursedAmount = data.disbursedAmount;
    }
    if (data.outstandingBalance !== undefined) {
      this._outstandingBalance = data.outstandingBalance;
    }
    if (data.status !== undefined) {
      this._status = data.status;
    }

    this.validateInvariants();
  }

  updateTerms(data: {
    interestRate?: number;
    monthlyPaymentAmount?: number;
    term?: number;
  }): void {
    if (data.interestRate !== undefined) {
      if (data.interestRate < 0 || data.interestRate > 1) {
        throw new Error('Interest rate must be between 0 and 1');
      }
      this._interestRate = data.interestRate;
    }
    if (data.monthlyPaymentAmount !== undefined) {
      if (data.monthlyPaymentAmount < 0) {
        throw new Error('Monthly payment amount cannot be negative');
      }
      this._monthlyPaymentAmount = data.monthlyPaymentAmount;
    }
    if (data.term !== undefined) {
      if (data.term < 1) {
        throw new Error('Loan term must be >= 1');
      }
      this._term = data.term;
    }

    this.validateInvariants();
  }

  updateApprovedAmount(newApprovedAmount: number): void {
    if (newApprovedAmount < 0) {
      throw new Error('Approved amount cannot be negative');
    }
    if (newApprovedAmount < this._disbursedAmount) {
      throw new Error(
        `Cannot reduce approved amount ($${newApprovedAmount}) below disbursed amount ($${this._disbursedAmount})`,
      );
    }

    const oldApprovedAmount = this._approvedAmount;
    this._approvedAmount = newApprovedAmount;

    // If no disbursement has been made, outstandingBalance matches approvedAmount
    if (
      this._disbursedAmount === 0 &&
      Math.abs(this._outstandingBalance - oldApprovedAmount) < 0.01
    ) {
      this._outstandingBalance = newApprovedAmount;
    }

    // Recalculate status
    if (this._disbursedAmount === this._approvedAmount) {
      this._status = LoanStatus.ACTIVE;
    } else {
      this._status = LoanStatus.PENDING;
    }

    this.validateInvariants();
  }

  disburse(amount: number): void {
    if (amount <= 0) {
      throw new Error('Disbursement amount must be > 0');
    }
    if (this._disbursedAmount + amount > this._approvedAmount) {
      throw new Error('Disbursement cannot exceed approved amount');
    }
    if (
      this._status !== LoanStatus.PENDING &&
      this._status !== LoanStatus.ACTIVE
    ) {
      throw new Error('Loan must be pending or active to disburse');
    }

    this._disbursedAmount += amount;
    // Actualizar outstanding_balance: incrementar por el monto desembolsado
    this._outstandingBalance += amount;
    if (this._status === LoanStatus.PENDING) {
      this._status = LoanStatus.ACTIVE;
    }
  }

  /**
   * Calculates the interest due based on the outstanding balance and interest rate
   * @returns The interest amount due for the current period
   */
  calculateInterestDue(): number {
    return Number((this._outstandingBalance * this._interestRate).toFixed(2));
  }

  recordPayment(principalAmount: number, interestAmount: number): void {
    if (principalAmount < 0 || interestAmount < 0) {
      throw new Error('Payment amounts must be >= 0');
    }
    if (
      this._status !== LoanStatus.ACTIVE &&
      this._status !== LoanStatus.PENDING
    ) {
      throw new Error('Can only record payments for active or pending loans');
    }

    const newBalance = Number(
      (this._outstandingBalance - principalAmount).toFixed(2),
    );
    if (newBalance < 0) {
      throw new Error('Payment cannot result in negative outstanding balance');
    }

    this._outstandingBalance = newBalance <= 0.001 ? 0 : newBalance;

    if (this._outstandingBalance === 0) {
      this._status = LoanStatus.PAID;
    }
  }

  markAsDefaulted(): void {
    if (this._status !== LoanStatus.ACTIVE) {
      throw new Error('Only active loans can be marked as defaulted');
    }
    this._status = LoanStatus.DEFAULTED;
  }

  private validateInvariants(): void {
    const EPSILON = 0.01; // Tolerancia para errores de precisión de punto flotante en moneda

    if (this._approvedAmount <= 0) {
      throw new Error('Loan approved amount must be > 0');
    }
    if (
      this._disbursedAmount < -EPSILON ||
      this._disbursedAmount > this._approvedAmount + EPSILON
    ) {
      throw new Error('Disbursed amount must be between 0 and approved amount');
    }
    if (this._outstandingBalance < -EPSILON) {
      throw new Error('Outstanding balance cannot be negative');
    }
    // El saldo pendiente no puede exceder el monto desembolsado
    // (ya que outstanding_balance = desembolsos - pagos de capital)
    // Excepción: cuando outstanding_balance <= approvedAmount, permitirlo
    // (esto cubre el estado inicial donde outstanding_balance = approvedAmount y disbursedAmount = 0)
    if (
      this._outstandingBalance > this._disbursedAmount + EPSILON &&
      this._outstandingBalance > this._approvedAmount + EPSILON
    ) {
      throw new Error(
        'Outstanding balance cannot exceed disbursed amount when it exceeds approved amount',
      );
    }
    // Validación más estricta: si se ha desembolsado algo, el outstanding_balance no puede exceder el disbursed_amount
    if (
      this._disbursedAmount > EPSILON &&
      this._outstandingBalance > this._disbursedAmount + EPSILON
    ) {
      throw new Error('Outstanding balance cannot exceed disbursed amount');
    }
    if (this._interestRate < 0 || this._interestRate > 1) {
      throw new Error('Interest rate must be between 0 and 1');
    }
    if (this._term < 1) {
      throw new Error('Loan term must be >= 1');
    }
    if (
      this._status !== LoanStatus.PENDING &&
      this._status !== LoanStatus.ACTIVE &&
      this._status !== LoanStatus.PAID &&
      this._status !== LoanStatus.DEFAULTED &&
      this._status !== LoanStatus.CLOSED
    ) {
      throw new Error(`Invalid Loan status: ${String(this._status)}`);
    }
  }

  get memberId(): string {
    return this._memberId;
  }

  get loanType(): string {
    return this._loanType;
  }

  get approvedAmount(): number {
    return this._approvedAmount;
  }

  get disbursedAmount(): number {
    return this._disbursedAmount;
  }

  get outstandingBalance(): number {
    return this._outstandingBalance;
  }

  get monthlyPaymentAmount(): number {
    return this._monthlyPaymentAmount;
  }

  get interestRate(): number {
    return this._interestRate;
  }

  get term(): number {
    return this._term;
  }

  get status(): string {
    return this._status;
  }

  get creationDate(): Date {
    return this._creationDate;
  }

  get guaranteedStockId(): string | null | undefined {
    return this._guaranteedStockId;
  }

  isActive(): boolean {
    return (
      this._status === LoanStatus.ACTIVE || this._status === LoanStatus.PENDING
    );
  }
}
