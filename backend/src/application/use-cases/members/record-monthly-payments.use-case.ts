import { RecordMonthlyPaymentsDto } from '@application/dto/members/record-monthly-payments.dto';
import { RecordMonthlyPaymentsResponseDto } from '@application/dto/members/record-monthly-payments-response.dto';
import {
  PaymentItemDto,
  PaymentType,
} from '@application/dto/members/payment-item.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidPaymentException } from '@application/exceptions/invalid-payment.exception';
import { DuplicateMonthlyPaymentException } from '@application/exceptions/duplicate-monthly-payment.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Meeting } from '@domain/entities/meeting.entity';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  FEE_INCOME_ACCOUNT,
  INSURANCE_INCOME_ACCOUNT,
  NOVELTY_LOSS_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Record Monthly Payments Use Case
 *
 * Orchestrates the recording of monthly payments from a member.
 * Processes multiple payment types and creates the corresponding accounting entries.
 *
 * Loan payments are delegated to RecordLoanPaymentUseCase to maintain
 * separation of responsibilities between the members and loans modules.
 */
export class RecordMonthlyPaymentsUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly operationRepository: OperationRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
    private readonly recordLoanPaymentUseCase: RecordLoanPaymentUseCase,
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

    // 4. Validate payments array is not empty
    if (!dto.payments || dto.payments.length === 0) {
      throw new InvalidPaymentException('At least one payment is required');
    }

    // 4.5. Check if this is an extraordinary payment (only loan payments)
    const isOnlyLoanPayments = dto.payments.every(
      (p) => p.type === PaymentType.LOAN_PAYMENT
    );

    // 3. Validate that member doesn't already have a monthly payment for this meeting
    // Skip this check if it's an extraordinary payment (only loan payments)
    if (!isOnlyLoanPayments) {
      const existingPayments = await this.operationRepository.findByMember(
        dto.memberId,
        {
          meetingId: activeMeeting.id,
          types: [OperationType.MONTHLY_PAYMENT],
        },
      );

      if (existingPayments.length > 0) {
        throw new DuplicateMonthlyPaymentException(
          dto.memberId,
          activeMeeting.id,
        );
      }
    }

    // 5. Validate all amounts are positive
    for (const payment of dto.payments) {
      if (payment.amount <= 0) {
        throw new InvalidPaymentException(
          `Payment amount must be positive, got ${payment.amount}`,
        );
      }
    }

    // 5.1. Validate novelty payments consistency
    for (const payment of dto.payments) {
      if (payment.type === PaymentType.NOVELTY) {
        if (payment.referenceId && !payment.affectedPaymentType) {
          throw new InvalidPaymentException(
            'Novelty payment with referenceId must include affectedPaymentType',
          );
        }
        if (
          payment.affectedPaymentType &&
          payment.affectedPaymentType === PaymentType.NOVELTY
        ) {
          throw new InvalidPaymentException(
            'affectedPaymentType cannot be NOVELTY',
          );
        }
      }
    }

    // 6. Separate loan payments from other payments
    const loanPayments: PaymentItemDto[] = [];
    const otherPayments: PaymentItemDto[] = [];

    for (const payment of dto.payments) {
      if (payment.type === PaymentType.LOAN_PAYMENT) {
        if (!payment.referenceId) {
          throw new InvalidPaymentException(
            'Loan payment must include a referenceId (loan ID)',
          );
        }
        loanPayments.push(payment);
      } else {
        otherPayments.push(payment);
      }
    }

    // 7. Process loan payments using RecordLoanPaymentUseCase (delegated to loans module)
    const loanPaymentResults: Array<{
      loanId: string;
      operationId: string;
      interestPaid: number;
      principalPaid: number;
    }> = [];

    for (const loanPayment of loanPayments) {
      const result = await this.recordLoanPaymentUseCase.execute({
        loanId: loanPayment.referenceId!,
        meetingId: activeMeeting.id,
        totalPaymentAmount: loanPayment.amount,
        notes: loanPayment.description,
      });

      loanPaymentResults.push({
        loanId: result.loanId,
        operationId: result.operationId,
        interestPaid: result.interestPaid,
        principalPaid: result.principalPaid,
      });
    }

    // 8. Process other payments and map to ledger entries
    const allEntries: RecordOperationDto['entries'] = [];
    let nonLoanTotalAmount = 0;
    const paymentDescriptions: string[] = [];

    for (const payment of otherPayments) {
      nonLoanTotalAmount += payment.amount;
      const entries = this.mapPaymentToLedgerEntries(payment);
      allEntries.push(...entries);

      // Collect payment descriptions for operation description
      if (payment.description) {
        paymentDescriptions.push(payment.description);
      }
    }

    // 9. Create operation using RecordOperationUseCase (only for non-loan payments)
    let mainOperationId: string | null = null;
    let mainLedgerEntryIds: string[] = [];

    if (otherPayments.length > 0) {
      // Build detailed operation description
      let operationDescription: string;
      if (paymentDescriptions.length > 0) {
        operationDescription = `Pago mensual ${member.name}: ${paymentDescriptions.join('; ')}`;
      } else {
        operationDescription = `Monthly payments for member ${member.name}`;
      }

      const operationDto: RecordOperationDto = {
        memberId: dto.memberId,
        meetingId: activeMeeting.id,
        type: OperationType.MONTHLY_PAYMENT,
        description: operationDescription,
        entries: allEntries,
      };

      const result = await this.recordOperationUseCase.execute(operationDto);
      mainOperationId = result.operationId;
      mainLedgerEntryIds = result.ledgerEntryIds;
    }

    // 10. Calculate total amount (including loan payments)
    const loanTotalAmount = loanPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = nonLoanTotalAmount + loanTotalAmount;

    // 11. Return response
    // Use main operation ID if available, otherwise use the first loan payment operation ID
    const responseOperationId =
      mainOperationId || loanPaymentResults[0]?.operationId || '';

    return {
      operationId: responseOperationId,
      meetingId: activeMeeting.id,
      memberId: dto.memberId,
      totalAmount,
      ledgerEntryIds: mainLedgerEntryIds,
    };
  }

  /**
   * Maps a payment item to ledger entries based on payment type
   * Note: LOAN_PAYMENT is not handled here - it's delegated to RecordLoanPaymentUseCase
   * @param payment - The payment item to map
   */
  private mapPaymentToLedgerEntries(
    payment: PaymentItemDto,
  ): RecordOperationDto['entries'] {
    const entries: RecordOperationDto['entries'] = [];

    switch (payment.type) {
      case PaymentType.STOCK_FEE: {
        const stockFeeDescription =
          payment.description ||
          `Cuota de acciones: ${payment.amount.toFixed(2)}`;

        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: stockFeeDescription,
          stockId: payment.referenceId || null,
        });
        // Stock capital entry (credit - increase capital)
        entries.push({
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -payment.amount,
          description: stockFeeDescription,
          stockId: payment.referenceId || null,
        });
        break;
      }

      case PaymentType.MANDATORY_CONTRIBUTION: {
        const mandatoryDescription =
          payment.description ||
          `Aporte obligatorio: ${payment.amount.toFixed(2)}`;

        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: mandatoryDescription,
          mandatoryContributionId: payment.referenceId || null,
        });
        // Mandatory contribution income entry (credit - income)
        entries.push({
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -payment.amount,
          description: mandatoryDescription,
          mandatoryContributionId: payment.referenceId || null,
        });
        break;
      }

      case PaymentType.FEE: {
        const feeDescription =
          payment.description ||
          `Multa/otro pago: ${payment.amount.toFixed(2)}`;

        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: feeDescription,
        });
        // Fee income entry (credit - income)
        entries.push({
          accountType: FEE_INCOME_ACCOUNT,
          amount: -payment.amount,
          description: feeDescription,
        });
        break;
      }

      case PaymentType.INSURANCE: {
        const insuranceDescription =
          payment.description ||
          `Seguro de deuda: ${payment.amount.toFixed(2)}`;

        // Cash entry (debit - money received)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: payment.amount,
          description: insuranceDescription,
        });
        // Insurance income entry (credit - income)
        entries.push({
          accountType: INSURANCE_INCOME_ACCOUNT,
          amount: -payment.amount,
          description: insuranceDescription,
        });
        break;
      }

      case PaymentType.NOVELTY: {
        // Build description with affected payment type information
        let baseDescription =
          payment.description ||
          `Novedad/descuento: ${payment.amount.toFixed(2)}`;

        // Enhance description with affected payment type if available
        if (payment.affectedPaymentType) {
          const affectedTypeLabels: Partial<Record<PaymentType, string>> = {
            [PaymentType.MANDATORY_CONTRIBUTION]: 'Aporte obligatorio',
            [PaymentType.STOCK_FEE]: 'Cuota de acciones',
            [PaymentType.LOAN_PAYMENT]: 'Pago de préstamo',
            [PaymentType.FEE]: 'Multa/otro pago',
            [PaymentType.INSURANCE]: 'Seguro de deuda',
          };

          const affectedLabel = affectedTypeLabels[payment.affectedPaymentType];
          if (affectedLabel && !payment.description) {
            baseDescription = `Novedad en ${affectedLabel}: ${payment.amount.toFixed(
              2,
            )}`;
          }

          // Add structured prefix [AFFECTED:tipo] for parseable metadata
          // This allows querying by affected type without modifying the database schema
          const affectedTypePrefix = `[AFFECTED:${payment.affectedPaymentType}]`;
          baseDescription = `${affectedTypePrefix}${baseDescription}`;
        }

        const noveltyDescription = baseDescription;

        // Determine which reference to use based on affectedPaymentType
        let mandatoryContributionId: string | null = null;
        let stockId: string | null = null;
        let loanId: string | null = null;

        if (payment.affectedPaymentType && payment.referenceId) {
          switch (payment.affectedPaymentType) {
            case PaymentType.MANDATORY_CONTRIBUTION:
              mandatoryContributionId = payment.referenceId;
              break;
            case PaymentType.STOCK_FEE:
              stockId = payment.referenceId;
              break;
            case PaymentType.LOAN_PAYMENT:
              loanId = payment.referenceId;
              break;
            // FEE and INSURANCE don't have references, but we still track the affectedPaymentType
            // in the description for traceability
            default:
              break;
          }
        }

        // Cash entry (credit - money goes out or negative entry)
        entries.push({
          accountType: CASH_ACCOUNT,
          amount: -payment.amount,
          description: noveltyDescription,
        });
        // Novelty loss entry (debit - loss) with reference to affected entity
        // For FEE and INSURANCE, no reference is assigned but affectedPaymentType
        // is documented in the description
        entries.push({
          accountType: NOVELTY_LOSS_ACCOUNT,
          amount: payment.amount,
          description: noveltyDescription,
          mandatoryContributionId,
          stockId,
          loanId,
        });
        break;
      }

      case PaymentType.LOAN_PAYMENT:
        // Loan payments are handled by RecordLoanPaymentUseCase
        // This case should never be reached due to filtering in execute()
        throw new InvalidRequestError(
          'Loan payments should be processed through RecordLoanPaymentUseCase',
        );

      default:
        throw new InvalidRequestError(
          `Unknown payment type: ${String(payment.type)}`,
        );
    }

    return entries;
  }
}
