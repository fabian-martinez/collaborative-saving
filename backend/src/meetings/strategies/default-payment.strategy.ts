import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
@Injectable()
export class DefaultPaymentStrategy implements PaymentStrategy {
  private readonly logger = new Logger(DefaultPaymentStrategy.name);

  process(
    _queryRunner: QueryRunner,
    _operation: Operation,
    payment: MemberDue,
  ): never {
    const message = `Unhandled payment type received: ${payment.type}. Payment must be explicitly mapped.`;
    this.logger.error(message);
    throw new Error(message);
  }
}
