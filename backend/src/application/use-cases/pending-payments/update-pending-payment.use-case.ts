import { Injectable } from '@nestjs/common';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { UpdatePendingPaymentDto } from '@application/dto/pending-payments/update-pending-payment.dto';
import { PendingMemberPaymentStatus } from '@domain/entities/pending-member-payment.entity';

@Injectable()
export class UpdatePendingPaymentUseCase {
  constructor(
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
  ) {}

  async execute(id: string, dto: UpdatePendingPaymentDto): Promise<void> {
    const payment = await this.pendingMemberPaymentRepository.findById(id);
    if (!payment) {
      throw new Error(`PendingMemberPayment with ID ${id} not found`);
    }

    // Use entity methods if the status changed to specific terminal states
    if (dto.status && (dto.status as string) !== payment.status) {
      if (dto.status === PendingMemberPaymentStatus.APPROVED) {
        payment.approve();
      } else if (dto.status === PendingMemberPaymentStatus.REJECTED) {
        payment.reject();
      } else if (dto.status === PendingMemberPaymentStatus.PAID) {
        payment.markAsPaid();
      } else if (dto.status === PendingMemberPaymentStatus.PENDING) {
        // Just directly update if moving backward, though normally we shouldn't.
        // Entity handles generic updates through update()
        payment.update({ status: dto.status });
      }
    }

    // Update other fields
    payment.update({
      amount: dto.amount,
      notes: dto.notes,
    });

    await this.pendingMemberPaymentRepository.save(payment);
  }
}
