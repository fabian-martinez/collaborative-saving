import { randomUUID } from 'crypto';
import { OperationType } from '../enums/operation-type.enum';
import { LedgerEntry } from './ledger-entry.entity';
import { BusinessRuleError } from '../errors/business-rule.error';

export class Operation {
  private _entries: LedgerEntry[] = [];

  constructor(
    public readonly id: string,
    private _memberId: string | null,
    private _meetingId: string,
    private _type: OperationType,
    private _date: Date,
    private _description?: string | null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    memberId?: string | null;
    meetingId: string;
    type: OperationType;
    date?: Date;
    description?: string | null;
  }): Operation {
    const id = randomUUID();
    return new Operation(
      id,
      data.memberId || null,
      data.meetingId,
      data.type,
      data.date || new Date(),
      data.description || null,
    );
  }

  static fromPersistence(data: {
    id: string;
    memberId?: string | null;
    meetingId: string;
    type: string;
    date: Date | string;
    description?: string | null;
  }): Operation {
    // Validate operation type
    if (!Object.values(OperationType).includes(data.type as OperationType)) {
      throw new Error(`Invalid operation type: ${data.type}`);
    }

    return new Operation(
      data.id,
      data.memberId ?? null,
      data.meetingId,
      data.type as OperationType,
      typeof data.date === 'string' ? new Date(data.date) : data.date,
      data.description ?? undefined,
    );
  }

  update(data: {
    memberId?: string | null;
    type?: OperationType;
    description?: string | null;
  }): void {
    if (data.memberId !== undefined) {
      this._memberId = data.memberId;
    }
    if (data.type !== undefined) {
      // Validate operation type
      if (!Object.values(OperationType).includes(data.type)) {
        throw new Error(`Invalid operation type: ${data.type}`);
      }
      this._type = data.type;
    }
    if (data.description !== undefined) {
      this._description = data.description;
    }

    this.validateInvariants();
  }

  /**
   * Sets the ledger entries for this operation and validates the balance.
   *
   * @param entries - Array of ledger entries
   * @throws BusinessRuleError if balance is invalid
   */
  setEntries(entries: LedgerEntry[]): void {
    this.validateBalance(entries);
    this._entries = [...entries];
  }

  /**
   * Validates that the sum of debits and credits is zero.
   *
   * @param entries - Entries to validate
   * @throws BusinessRuleError if balance is invalid
   */
  private validateBalance(entries: LedgerEntry[]): void {
    if (entries.length < 2) {
      throw new BusinessRuleError(
        `Operation must have at least 2 ledger entries, got ${entries.length}`,
      );
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      const amount = entry.amount;
      if (amount > 0) {
        totalDebits += amount;
      } else if (amount < 0) {
        totalCredits += Math.abs(amount);
      } else {
        throw new BusinessRuleError('Ledger entry amount cannot be zero');
      }
    }

    // Round to 2 decimal places to avoid floating point precision issues
    const roundedDebits = Math.round(totalDebits * 100) / 100;
    const roundedCredits = Math.round(totalCredits * 100) / 100;

    if (roundedDebits !== roundedCredits) {
      throw new BusinessRuleError(
        `Operation is not balanced: debits = ${roundedDebits}, credits = ${roundedCredits}`,
      );
    }
  }

  private validateInvariants(): void {
    if (!this._type) {
      throw new Error('Operation type is required');
    }
    if (!Object.values(OperationType).includes(this._type)) {
      throw new Error(`Invalid operation type: ${this._type}`);
    }
    if (!this._meetingId) {
      throw new Error('Operation meetingId is required');
    }
    // Allow a small margin (5 minutes) to handle time differences between server and database
    const now = new Date();
    const maxAllowedDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes in the future
    if (this._date > maxAllowedDate) {
      throw new Error('Operation date cannot be in the future');
    }

    // If we have entries, they must be balanced
    if (this._entries.length > 0) {
      this.validateBalance(this._entries);
    }
  }

  get memberId(): string | null {
    return this._memberId;
  }

  get meetingId(): string {
    return this._meetingId;
  }

  get type(): OperationType {
    return this._type;
  }

  get date(): Date {
    return this._date;
  }

  get description(): string | null | undefined {
    return this._description;
  }

  get entries(): LedgerEntry[] {
    return [...this._entries];
  }
}
