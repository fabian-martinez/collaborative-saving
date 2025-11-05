import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { MemberPaymentResponseDto } from '../dto/members/member-payment-response.dto';
import { MemberPaymentEntryDto } from '../dto/members/member-payment-entry.dto';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';

/**
 * Member Payment Mapper
 *
 * Application layer mapper that transforms domain entities to DTOs.
 * This mapper handles the conversion from domain models to application DTOs.
 */
export class MemberPaymentMapper {
  /**
   * Maps an Operation and its LedgerEntries to a MemberPaymentResponseDto.
   *
   * @param operation - The operation entity
   * @param entries - The ledger entries for this operation
   * @param paymentMapperService - Service for payment calculations and type mappings
   * @returns The payment response DTO
   */
  static toDto(
    operation: Operation,
    entries: LedgerEntry[],
    paymentMapperService: PaymentMapperService,
  ): MemberPaymentResponseDto {
    const entryDtos = entries.map((entry) => this.toEntryDto(entry));

    const totalAmount =
      paymentMapperService.calculatePaymentTotalAmount(entries);
    const paymentType = paymentMapperService.mapOperationTypeToPaymentType(
      operation.type,
    );

    return {
      operationId: operation.id,
      type: paymentType,
      totalAmount,
      description: operation.description || undefined,
      date: operation.date,
      meetingId: operation.meetingId,
      entries: entryDtos,
    };
  }

  /**
   * Maps a LedgerEntry to a MemberPaymentEntryDto.
   *
   * @param entry - The ledger entry entity
   * @returns The entry DTO
   */
  static toEntryDto(entry: LedgerEntry): MemberPaymentEntryDto {
    return {
      id: entry.id,
      accountType: entry.accountType,
      amount: entry.amount,
      description: entry.description || undefined,
      loanId: entry.loanId || undefined,
      stockId: entry.stockId || undefined,
      mandatoryContributionId: entry.mandatoryContributionId || undefined,
      stockSubscriptionId: entry.stockSubscriptionId || undefined,
    };
  }
}
