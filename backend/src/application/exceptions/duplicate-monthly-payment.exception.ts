import { BadRequestException } from '@nestjs/common';

/**
 * Duplicate Monthly Payment Exception
 *
 * Application-level exception for when a member tries to record
 * more than one monthly payment for the same meeting.
 */
export class DuplicateMonthlyPaymentException extends BadRequestException {
  constructor(memberId: string, meetingId: string) {
    super(
      `El socio ya ha realizado su pago mensual en esta reunión. Member ID: ${memberId}, Meeting ID: ${meetingId}`,
    );
    this.name = 'DuplicateMonthlyPaymentException';
  }
}
