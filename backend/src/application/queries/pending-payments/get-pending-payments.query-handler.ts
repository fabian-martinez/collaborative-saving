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

    // Pre-fetch member names optionally to avoid N+1 if we needed them,
    // but the MemberRepository doesn't have findByIds yet. We'll fetch them individually for now or skip.
    // For simplicity and considering member names are useful in UI:
    // We'll collect unique member IDs and fetch them.
    const memberIds = [...new Set(domainEntities.map((e) => e.memberId))];
    const memberMap = new Map<string, Member>();

    await Promise.all(
      memberIds.map(async (id) => {
        const member = await this.memberRepository.findById(id);
        if (member) {
          memberMap.set(id, member);
        }
      }),
    );

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
