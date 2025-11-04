import { RecordMonthlyPaymentsDto } from '@application/dto/members/record-monthly-payments.dto';
import { RecordMonthlyPaymentsResponseDto } from '@application/dto/members/record-monthly-payments-response.dto';
import {
  PaymentItemDto,
  PaymentType,
} from '@application/dto/members/payment-item.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidPaymentException } from '@application/exceptions/invalid-payment.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Meeting } from '@domain/entities/meeting.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  FEE_INCOME_ACCOUNT,
  INSURANCE_INCOME_ACCOUNT,
  NOVELTY_LOSS_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Record Monthly Payments Use Case
 *
 * Orchestrates the recording of monthly payments from a member.
 * Processes multiple payment types and creates the corresponding accounting entries.
 */
export class RecordMonthlyPaymentsUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(
    dto: RecordMonthlyPaymentsDto,
  ): Promise<RecordMonthlyPaymentsResponseDto> {
    // 1. Validate member exists
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new MemberNotFoundException(dto.memberId);
    }

    // 2. Get active meeting (or use provided meetingId)
    let meeting: Meeting | null;
    if (dto.meetingId) {
      meeting = await this.meetingRepository.findById(dto.meetingId);
      if (!meeting) {
        throw new MeetingNotFoundException(dto.meetingId);
      }
    } else {
      meeting = await this.meetingRepository.findActive();
      if (!meeting) {
        throw new MeetingNotFoundException();
      }
    }

    // At this point, meeting is guaranteed to be non-null
    const activeMeeting = meeting;

    // 3. Validate payments array is not empty
    if (!dto.payments || dto.payments.length === 0) {
      throw new InvalidPaymentException('At least one payment is required');
    }

    // 4. Validate all amounts are positive
    for (const payment of dto.payments) {
      if (payment.amount <= 0) {
        throw new InvalidPaymentException(
          `Payment amount must be positive, got ${payment.amount}`,
        );
      }
    }

    // 5. Validate loan payments and prepare loan updates
    const loanPayments: Array<{
      loanId: string;
      amount: number;
      description?: string;
    }> = [];

    for (const payment of dto.payments) {
      if (payment.type === PaymentType.LOAN_PAYMENT) {
        if (!payment.referenceId) {
          throw new InvalidPaymentException(
            'Loan payment must include a referenceId (loan ID)',
          );
        }
        // Validate loan exists
        const loan = await this.loanRepository.findById(payment.referenceId);
        if (!loan) {
          throw new LoanNotFoundException(payment.referenceId);
        }
        loanPayments.push({
          loanId: payment.referenceId,
          amount: payment.amount,
          description: payment.description,
        });
      }
    }

    // 6. Process payments and map to ledger entries
    const allEntries: RecordOperationDto['entries'] = [];
    let totalAmount = 0;

    for (const payment of dto.payments) {
      totalAmount += payment.amount;
      const entries = this.mapPaymentToLedgerEntries(payment);
      allEntries.push(...entries);
    }

    // 7. Create operation using RecordOperationUseCase
    const operationDto: RecordOperationDto = {
      memberId: dto.memberId,
      meetingId: activeMeeting.id,
      type: OperationType.MONTHLY_PAYMENT,
      description: `Monthly payments for member ${member.name}`,
      entries: allEntries,
    };

    const result = await this.recordOperationUseCase.execute(operationDto);

    // 8. Process loan payments: update loans and create transaction details
    for (const loanPayment of loanPayments) {
      // Get the loan again to ensure we have the latest state
      const loan = await this.loanRepository.findById(loanPayment.loanId);
      if (!loan) {
        // This should not happen since we validated earlier, but handle it gracefully
        throw new LoanNotFoundException(loanPayment.loanId);
      }

      // Apply domain logic: record payment (updates internal state)
      loan.recordPayment(loanPayment.amount, 0); // For now, treat entire amount as principal

      // Save updated loan
      await this.loanRepository.save(loan);

      // Create loan transaction detail for history
      const transactionDetail = LoanTransactionDetail.create({
        loanId: loan.id,
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: loanPayment.amount,
        notes: loanPayment.description || null,
        operationId: result.operationId,
      });

      await this.loanTransactionDetailRepository.save(transactionDetail);
    }

    // 9. Return response
    return {
      operationId: result.operationId,
      meetingId: activeMeeting.id,
      memberId: dto.memberId,
      totalAmount,
      ledgerEntryIds: result.ledgerEntryIds,
    };
  }

  /**
   * Maps a payment item to ledger entries based on payment type
   */
  private mapPaymentToLedgerEntries(
    payment: PaymentItemDto,
  ): RecordOperationDto['entries'] {
    const entries: RecordOperationDto['entries'] = [];

    switch (payment.type) {
      case PaymentType.STOCK_FEE:
        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: payment.description || 'Stock fee payment',
          stockId: payment.referenceId || null,
        });
        // Stock capital entry (credit - increase capital)
        entries.push({
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -payment.amount,
          description: payment.description || 'Stock fee payment',
          stockId: payment.referenceId || null,
        });
        break;

      case PaymentType.MANDATORY_CONTRIBUTION:
        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: payment.description || 'Mandatory contribution',
          mandatoryContributionId: payment.referenceId || null,
        });
        // Mandatory contribution income entry (credit - income)
        entries.push({
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -payment.amount,
          description: payment.description || 'Mandatory contribution',
          mandatoryContributionId: payment.referenceId || null,
        });
        break;

      case PaymentType.FEE:
        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: payment.description || 'Fee payment',
        });
        // Fee income entry (credit - income)
        entries.push({
          accountType: FEE_INCOME_ACCOUNT,
          amount: -payment.amount,
          description: payment.description || 'Fee payment',
        });
        break;

      case PaymentType.INSURANCE:
        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: payment.description || 'Insurance payment',
        });
        // Insurance income entry (credit - income)
        entries.push({
          accountType: INSURANCE_INCOME_ACCOUNT,
          amount: -payment.amount,
          description: payment.description || 'Insurance payment',
        });
        break;

      case PaymentType.NOVELTY:
        // Novelty is special: it represents a loss/discount
        // Cash entry (credit - money goes out or negative entry)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: -payment.amount,
          description: payment.description || 'Novelty payment',
        });
        // Novelty loss entry (debit - loss)
        entries.push({
          accountType: NOVELTY_LOSS_ACCOUNT,
          amount: payment.amount,
          description: payment.description || 'Novelty payment',
        });
        break;

      case PaymentType.LOAN_PAYMENT:
        // Loan payment ledger entries (domain logic handled separately above)
        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: payment.description || 'Loan payment',
          loanId: payment.referenceId || null,
        });
        // Loans receivable entry (credit - reduce loan balance)
        // Note: The actual loan balance update is handled by loan.recordPayment()
        // in step 8 of the execute method
        entries.push({
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: -payment.amount,
          description: payment.description || 'Loan payment',
          loanId: payment.referenceId || null,
        });
        break;

      default:
        throw new InvalidRequestError(
          `Unknown payment type: ${String(payment.type)}`,
        );
    }

    return entries;
  }
}
