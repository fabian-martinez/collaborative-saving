import { Injectable } from '@nestjs/common';
import { GetPendingPaymentsQueryDto } from '@application/dto/pending-payments/get-pending-payments-query.dto';
import { PendingMemberPaymentResponseDto } from '@application/dto/pending-payments/pending-member-payment-response.dto';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';

@Injectable()
export class GetPendingPaymentsQueryHandler {
  constructor(
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(
    query: GetPendingPaymentsQueryDto,
  ): Promise<PendingMemberPaymentResponseDto[]> {
    const domainEntities =
      await this.pendingMemberPaymentRepository.findWithFilters({
        status: query.status,
        memberId: query.memberId,
        meetingId: query.meetingId,
        type: query.type,
      });

    const dtos: PendingMemberPaymentResponseDto[] = [];

    // Pre-fetch member names to avoid N+1 queries.
    // ⚡ Bolt: Cache members for O(1) lookups instead of N+1 database queries
    // For simplicity and considering member names are useful in UI:
    // We collect unique member IDs and fetch them.
    const memberIds = [...new Set(domainEntities.map((e) => e.memberId))];
    const memberMap = new Map<string, Member>();

    if (memberIds.length > 0) {
      const members = await this.memberRepository.findByIds(memberIds);
      for (const member of members) {
        memberMap.set(member.id, member);
      }
    }

    for (const entity of domainEntities) {
      const member = memberMap.get(entity.memberId);
      dtos.push({
        id: entity.id,
        memberId: entity.memberId,
        meetingId: entity.meetingId,
        type: entity.type,
        amount: entity.amount,
        status: entity.status,
        notes: entity.notes,
        createdAt: entity.createdAt,
        referenceMeetingId: entity.referenceMeetingId,
        stockId: entity.stockId,
        loanId: entity.loanId,
        stockSubscriptionId: entity.stockSubscriptionId,
        disbursementType: entity.disbursementType,
        memberName: member?.name,
        firstName: member?.name?.split(' ')[0],
        lastName: member?.name?.split(' ').slice(1).join(' '),
      });
    }

    return dtos;
  }
}
