import { Injectable } from '@nestjs/common';
import { OperationType } from '@domain/enums/operation-type.enum';
import { GetMemberPaymentsQueryDto } from '@application/dto/members/get-member-payments-query.dto';
import { MemberPaymentResponseDto } from '@application/dto/members/member-payment-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { Operation } from '@domain/entities/operation.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { PaymentMapperService } from '@domain/services/payment-mapper.service';
import { LedgerEntryGrouper } from '@domain/utils/ledger-entry-grouper';
import { MemberPaymentMapper } from '@application/mappers/member-payment.mapper';

/**
 * Get Member Payments Query Handler
 *
 * Retrieves payments made by a member, with optional filtering by payment type and meeting.
 */
@Injectable()
export class GetMemberPaymentsQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly paymentMapperService: PaymentMapperService,
  ) {}

  async execute(
    memberId: string,
    query: GetMemberPaymentsQueryDto,
  ): Promise<MemberPaymentResponseDto[]> {
    // Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // Get OperationTypes to filter based on PaymentFilterType using domain service
    const operationTypes: OperationType[] | undefined = query.paymentType
      ? this.paymentMapperService.mapPaymentFilterToOperationTypes(
          query.paymentType,
        )
      : undefined;

    // Get operations using repository v2
    const operations = await this.operationRepository.findByMember(memberId, {
      meetingId: query.meetingId,
      types: operationTypes,
    });

    // Get all ledger entries for these operations using repository v2
    const operationIds = operations.map((op) => op.id);
    const allEntries =
      operationIds.length > 0
        ? await this.ledgerEntryRepository.findByOperations(operationIds)
        : [];

    // Group entries by operation using domain utility
    const entriesByOperation = LedgerEntryGrouper.groupByOperation(allEntries);

    // Map operations to payment response DTOs using application mapper
    return operations.map((operation: Operation) => {
      const entries = entriesByOperation.get(operation.id) || [];
      return MemberPaymentMapper.toDto(
        operation,
        entries,
        this.paymentMapperService,
      );
    });
  }
}
