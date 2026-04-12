import { Injectable } from '@nestjs/common';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { PendingMemberPaymentStatus } from '@domain/entities/pending-member-payment.entity';

@Injectable()
export class DeletePendingPaymentUseCase {
  constructor(
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const payment = await this.pendingMemberPaymentRepository.findById(id);
    if (!payment) {
      throw new Error(`PendingMemberPayment with ID ${id} not found`);
    }

    if (payment.status === (PendingMemberPaymentStatus.PAID as string)) {
      throw new Error(`Cannot delete a paid PendingMemberPayment`);
    }

    await this.pendingMemberPaymentRepository.delete(id);
  }
}
