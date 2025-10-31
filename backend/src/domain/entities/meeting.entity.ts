import { randomUUID } from 'crypto';

export enum MeetingStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export class Meeting {
  constructor(
    public readonly id: string,
    private _date: Date,
    private _status: MeetingStatus,
    private _notes: string | null,
    public readonly createdAt: Date,
  ) {
    this.validateInvariants();
  }

  static create(data: { date?: Date; notes?: string | null }): Meeting {
    const id = randomUUID();
    return new Meeting(
      id,
      data.date || new Date(),
      MeetingStatus.ACTIVE,
      data.notes || null,
      new Date(),
    );
  }

  static fromPersistence(data: {
    id: string;
    date: Date | string;
    status: string;
    notes?: string | null;
    created_at?: Date | string;
  }): Meeting {
    return new Meeting(
      data.id,
      typeof data.date === 'string' ? new Date(data.date) : data.date,
      data.status === 'closed' ? MeetingStatus.CLOSED : MeetingStatus.ACTIVE,
      data.notes ?? null,
      data.created_at
        ? typeof data.created_at === 'string'
          ? new Date(data.created_at)
          : data.created_at
        : new Date(),
    );
  }

  updateNotes(notes: string | null): void {
    this._notes = notes;
  }

  close(): void {
    if (this._status === MeetingStatus.CLOSED) {
      throw new Error('Meeting is already closed');
    }
    this._status = MeetingStatus.CLOSED;
  }

  private validateInvariants(): void {
    if (this._date > new Date()) {
      throw new Error('Meeting date cannot be in the future');
    }
  }

  get date(): Date {
    return this._date;
  }

  get status(): string {
    return this._status;
  }

  get notes(): string | null {
    return this._notes;
  }

  isActive(): boolean {
    return this._status === MeetingStatus.ACTIVE;
  }

  isClosed(): boolean {
    return this._status === MeetingStatus.CLOSED;
  }
}
