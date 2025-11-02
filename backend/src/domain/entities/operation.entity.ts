import { randomUUID } from 'crypto';

export class Operation {
  constructor(
    public readonly id: string,
    private _memberId: string | null,
    private _meetingId: string,
    private _type: string,
    private _date: Date,
    private _description?: string | null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    memberId?: string | null;
    meetingId: string;
    type: string;
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
    return new Operation(
      data.id,
      data.member_id ?? null,
      data.meeting_id,
      data.type,
      typeof data.date === 'string' ? new Date(data.date) : data.date,
      data.description ?? undefined,
    );
  }

  update(data: {
    memberId?: string | null;
    type?: string;
    description?: string | null;
  }): void {
    if (data.memberId !== undefined) {
      this._memberId = data.memberId;
    }
    if (data.type !== undefined) {
      this._type = data.type;
    }
    if (data.description !== undefined) {
      this._description = data.description;
    }

    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this._type || this._type.trim().length === 0) {
      throw new Error('Operation type is required');
    }
    if (!this._meetingId) {
      throw new Error('Operation meetingId is required');
    }
    if (this._date > new Date()) {
      throw new Error('Operation date cannot be in the future');
    }
  }

  get memberId(): string | null {
    return this._memberId;
  }

  get meetingId(): string {
    return this._meetingId;
  }

  get type(): string {
    return this._type;
  }

  get date(): Date {
    return this._date;
  }

  get description(): string | null | undefined {
    return this._description;
  }
}
