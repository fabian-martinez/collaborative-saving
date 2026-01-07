import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@domain/events/domain-event.base';
import { EventBus } from '@domain/ports/services/event-bus.port';

@Injectable()
export class NestjsEventBus implements EventBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    await this.eventEmitter.emitAsync(event.eventName, event);
  }

  subscribe<T>(
    eventName: string,
    handler: (event: DomainEvent<T>) => Promise<void> | void,
  ): void {
    this.eventEmitter.on(eventName, (event: DomainEvent<T>) => {
      const result = handler(event);
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(`Error handling event ${eventName}:`, error);
        });
      }
    });
  }
}
