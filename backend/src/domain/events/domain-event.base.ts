import { randomUUID } from 'node:crypto';

export abstract class DomainEvent<T = any> {
  readonly occurredOn: Date;
  readonly eventId: string;

  constructor(
    public readonly eventName: string,
    public readonly payload: T,
    occurredOn?: Date,
    eventId?: string,
  ) {
    this.occurredOn = occurredOn || new Date();
    this.eventId = eventId || randomUUID();
  }
}
