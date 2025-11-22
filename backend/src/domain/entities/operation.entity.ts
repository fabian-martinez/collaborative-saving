import { randomUUID } from 'crypto';
import { OperationType } from '../enums/operation-type.enum';

export class Operation {
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
    member_id?: string | null;
    meeting_id: string;
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
      data.member_id ?? null,
      data.meeting_id,
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
    // This is common in distributed systems and prevents false positives
    const now = new Date();
    const maxAllowedDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes in the future
    if (this._date > maxAllowedDate) {
      throw new Error('Operation date cannot be in the future');
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
}
