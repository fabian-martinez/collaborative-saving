import { randomUUID } from 'crypto';

export enum PendingMemberPaymentType {
  DIVIDEND = 'dividend',
  STOCK_WITHDRAWAL = 'stock_withdrawal',
  LOAN = 'loan',
  OTHER = 'other',
  PARTIAL_SETTLEMENT = 'partial_settlement',
}

export enum PendingMemberPaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

export class PendingMemberPayment {
  constructor(
    public readonly id: string,
    private _memberId: string,
    private _meetingId: string,
    private _type: PendingMemberPaymentType,
    private _amount: number,
    private _status: PendingMemberPaymentStatus,
    private _createdAt: Date,
    private _notes?: string | null,
    private _stockId?: string | null,
    private _loanId?: string | null,
    private _stockSubscriptionId?: string | null,
    private _referenceMeetingId?: string | null,
    private _disbursementType?: string | null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    memberId: string;
    meetingId: string;
    type: PendingMemberPaymentType;
    amount: number;
    notes?: string | null;
    stockId?: string | null;
    loanId?: string | null;
    stockSubscriptionId?: string | null;
    referenceMeetingId?: string | null;
    disbursementType?: string | null;
  }): PendingMemberPayment {
    const id = randomUUID();
    return new PendingMemberPayment(
      id,
      data.memberId,
      data.meetingId,
      data.type,
      data.amount,
      PendingMemberPaymentStatus.PENDING,
      new Date(),
      data.notes || null,
      data.stockId || null,
      data.loanId || null,
      data.stockSubscriptionId || null,
      data.referenceMeetingId || null,
      data.disbursementType || null,
    );
  }

  static fromPersistence(data: {
    id: string;
    member_id: string;
    meeting_id: string;
    type: string;
    amount: number | string;
    status: string;
    created_at: Date | string;
    notes?: string | null;
    stock_id?: string | null;
    loan_id?: string | null;
    stock_subscription_id?: string | null;
    reference_meeting_id?: string | null;
    disbursement_type?: string | null;
  }): PendingMemberPayment {
    return new PendingMemberPayment(
      data.id,
      data.member_id,
      data.meeting_id,
      data.type as PendingMemberPaymentType,
      Number(data.amount),
      data.status as PendingMemberPaymentStatus,
      typeof data.created_at === 'string'
        ? new Date(data.created_at)
        : data.created_at,
      data.notes ?? undefined,
      data.stock_id ?? undefined,
      data.loan_id ?? undefined,
      data.stock_subscription_id ?? undefined,
      data.reference_meeting_id ?? undefined,
      data.disbursement_type ?? undefined,
    );
  }

  update(data: {
    amount?: number;
    status?: PendingMemberPaymentStatus;
    notes?: string | null;
  }): void {
    if (data.amount !== undefined) {
      this._amount = data.amount;
    }
    if (data.status !== undefined) {
      this._status = data.status;
    }
    if (data.notes !== undefined) {
      this._notes = data.notes;
    }

    this.validateInvariants();
  }

  approve(): void {
    if (this._status !== PendingMemberPaymentStatus.PENDING) {
      throw new Error('Can only approve pending payments');
    }
    this._status = PendingMemberPaymentStatus.APPROVED;
  }

  reject(): void {
    if (this._status !== PendingMemberPaymentStatus.PENDING) {
      throw new Error('Can only reject pending payments');
    }
    this._status = PendingMemberPaymentStatus.REJECTED;
  }

  markAsPaid(): void {
    if (this._status !== PendingMemberPaymentStatus.APPROVED) {
      throw new Error('Can only mark approved payments as paid');
    }
    this._status = PendingMemberPaymentStatus.PAID;
  }

  private validateInvariants(): void {
    if (this._amount <= 0) {
      throw new Error('PendingMemberPayment amount must be > 0');
    }
    if (!this._memberId) {
      throw new Error('PendingMemberPayment memberId is required');
    }
    if (!this._meetingId) {
      throw new Error('PendingMemberPayment meetingId is required');
    }
    if (
      this._status !== PendingMemberPaymentStatus.PENDING &&
      this._status !== PendingMemberPaymentStatus.APPROVED &&
      this._status !== PendingMemberPaymentStatus.REJECTED &&
      this._status !== PendingMemberPaymentStatus.PAID
    ) {
      throw new Error(
        `Invalid PendingMemberPayment status: ${String(this._status)}`,
      );
    }
  }

  get memberId(): string {
    return this._memberId;
  }

  get meetingId(): string {
    return this._meetingId;
  }

  get type(): string {
    return this._type;
  }

  get amount(): number {
    return this._amount;
  }

  get status(): string {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get notes(): string | null | undefined {
    return this._notes;
  }

  get stockId(): string | null | undefined {
    return this._stockId;
  }

  get loanId(): string | null | undefined {
    return this._loanId;
  }

  get stockSubscriptionId(): string | null | undefined {
    return this._stockSubscriptionId;
  }

  get referenceMeetingId(): string | null | undefined {
    return this._referenceMeetingId;
  }

  get disbursementType(): string | null | undefined {
    return this._disbursementType;
  }

  isPending(): boolean {
    return this._status === PendingMemberPaymentStatus.PENDING;
  }
}
