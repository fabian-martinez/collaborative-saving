/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { NestjsEventBus } from './nestjs-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.base';

class TestDomainEvent extends DomainEvent<{ value: string }> {
  constructor(payload: { value: string }) {
    super('test.event', payload);
  }
}

describe('NestjsEventBus', () => {
  let eventBus: NestjsEventBus;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let emitAsyncSpy: jest.SpyInstance;
  let onSpy: jest.SpyInstance;

  beforeEach(() => {
    eventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
      on: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    emitAsyncSpy = jest.spyOn(eventEmitter, 'emitAsync');
    onSpy = jest.spyOn(eventEmitter, 'on');

    eventBus = new NestjsEventBus(eventEmitter);
  });

  describe('publish', () => {
    it('should emit event asynchronously via EventEmitter2', async () => {
      // ARRANGE
      const event = new TestDomainEvent({ value: 'hello' });

      // ACT
      await eventBus.publish(event);

      // ASSERT
      expect(emitAsyncSpy).toHaveBeenCalledWith('test.event', event);
    });
  });

  describe('subscribe', () => {
    it('should register synchronous handler and execute it when event triggers', () => {
      // ARRANGE
      const handler = jest.fn();
      const event = new TestDomainEvent({ value: 'sync' });
      let registeredCallback:
        | ((e: DomainEvent<{ value: string }>) => void)
        | undefined;
      eventEmitter.on.mockImplementation(
        (_name: string | symbol, listener: (...args: any[]) => void) => {
          registeredCallback = listener as (
            e: DomainEvent<{ value: string }>,
          ) => void;
          return eventEmitter;
        },
      );

      // ACT
      eventBus.subscribe('test.event', handler);
      registeredCallback?.(event);

      // ASSERT
      expect(onSpy).toHaveBeenCalledWith('test.event', expect.any(Function));
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should catch and log errors from rejected async handlers', async () => {
      // ARRANGE
      const error = new Error('Async handler failed');
      const handler = jest.fn().mockRejectedValue(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const event = new TestDomainEvent({ value: 'async-fail' });
      let registeredCallback:
        | ((e: DomainEvent<{ value: string }>) => void)
        | undefined;
      eventEmitter.on.mockImplementation(
        (_name: string | symbol, listener: (...args: any[]) => void) => {
          registeredCallback = listener as (
            e: DomainEvent<{ value: string }>,
          ) => void;
          return eventEmitter;
        },
      );

      // ACT
      eventBus.subscribe('test.event', handler);
      registeredCallback?.(event);
      await new Promise((resolve) => setImmediate(resolve));

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error handling event test.event:',
        error,
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
