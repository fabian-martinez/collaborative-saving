import { DomainEvent } from '../../events/domain-event.base';

export abstract class EventBus {
  abstract publish<T>(event: DomainEvent<T>): Promise<void>;
  abstract subscribe<T>(
    eventName: string,
    handler: (event: DomainEvent<T>) => Promise<void> | void,
  ): void;
}
