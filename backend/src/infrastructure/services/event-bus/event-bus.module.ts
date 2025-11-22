import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBus } from '@domain/ports/services/event-bus.port';
import { NestjsEventBus } from './nestjs-event-bus.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: EventBus,
      useClass: NestjsEventBus,
    },
  ],
  exports: [EventBus],
})
export class EventBusModule {}
