import { UpdateLoanApprovedAmountDto } from '@application/dto/loans/update-loan-approved-amount.dto';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { EventBus } from '@domain/ports/services/event-bus.port';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { LoanApprovedAmountChangedEvent } from '@domain/events/loan-approved-amount-changed.event';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';

/**
 * Use Case to update a loan's approved amount and synchronize its pending payment.
 */
export class UpdateLoanApprovedAmountUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly transactionManager: TransactionManager,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: UpdateLoanApprovedAmountDto): Promise<void> {
    return this.transactionManager.execute(async () => {
      // 1. Load the loan
      const loan = await this.loanRepository.findById(dto.loanId);
      if (!loan) {
        throw new LoanNotFoundException(dto.loanId);
      }

      const previousApprovedAmount = loan.approvedAmount;

      if (dto.newApprovedAmount === previousApprovedAmount) {
        return; // No changes
      }

      // 2. Get active meeting
      const activeMeeting = await this.meetingRepository.findActive();
      if (!activeMeeting) {
        throw new BusinessRuleError(
          'No hay ninguna reunión activa para realizar este cambio.',
        );
      }

      // 3. Update approved amount on Loan entity (validates constraints)
      loan.updateApprovedAmount(dto.newApprovedAmount);
      await this.loanRepository.save(loan);

      // 4. Find the pending member payment for this loan
      const memberPayments =
        await this.pendingMemberPaymentRepository.findByMember(loan.memberId);
      const loanPendingPayment = memberPayments.find(
        (p) =>
          p.loanId === loan.id &&
          (p.status === 'pending' || p.status === 'approved'),
      );

      const remainingToDeliver = loan.approvedAmount - loan.disbursedAmount;

      if (remainingToDeliver === 0) {
        // If no remaining balance, delete the pending payment if it exists
        if (loanPendingPayment) {
          await this.pendingMemberPaymentRepository.delete(
            loanPendingPayment.id,
          );
        }
      } else {
        // Update or create pending payment for the remaining balance
        if (loanPendingPayment) {
          loanPendingPayment.update({
            amount: remainingToDeliver,
          });
          await this.pendingMemberPaymentRepository.save(loanPendingPayment);
        } else {
          const newPendingPayment = PendingMemberPayment.create({
            memberId: loan.memberId,
            meetingId: activeMeeting.id,
            type: PendingMemberPaymentType.LOAN,
            amount: remainingToDeliver,
            loanId: loan.id,
            notes: 'Saldo pendiente de préstamo (Ajustado)',
          });
          await this.pendingMemberPaymentRepository.save(newPendingPayment);
        }
      }

      // 5. Emit domain event
      const event = new LoanApprovedAmountChangedEvent({
        loanId: loan.id,
        memberId: loan.memberId,
        previousApprovedAmount,
        newApprovedAmount: dto.newApprovedAmount,
        changedBy: dto.changedBy,
      });
      await this.eventBus.publish(event);
    });
  }
}
