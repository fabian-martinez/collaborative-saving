import { Injectable } from '@nestjs/common';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecentActivityResponseDto } from '@application/dto/dashboard/recent-activity-response.dto';
import { LedgerEntryGrouper } from '@domain/utils/ledger-entry-grouper';

@Injectable()
export class GetRecentActivityQueryHandler {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly memberRepository: MemberRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(): Promise<RecentActivityResponseDto[]> {
    const paginatedOperations =
      await this.operationRepository.findWithPagination(
        {},
        { page: 1, limit: 10 },
        'DESC',
      );

    const operations = paginatedOperations.data;
    if (operations.length === 0) {
      return [];
    }

    const operationIds = operations.map((op) => op.id);
    const memberIds = Array.from(
      new Set(
        operations
          .map((op) => op.memberId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const [entries, members] = await Promise.all([
      this.ledgerEntryRepository.findByOperations(operationIds),
      memberIds.length > 0
        ? this.memberRepository.findByIds(memberIds)
        : Promise.resolve([]),
    ]);

    const memberMap = new Map(members.map((m) => [m.id, m]));
    const entriesByOperation = LedgerEntryGrouper.groupByOperation(entries);

    return operations.map((op) => {
      const opEntries = entriesByOperation.get(op.id) || [];
      const positiveAmount = opEntries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

      const amount =
        positiveAmount > 0
          ? positiveAmount
          : opEntries.reduce((sum, e) => sum + Math.abs(e.amount), 0) / 2;

      const member = op.memberId ? memberMap.get(op.memberId) : null;

      return {
        id: op.id,
        type: op.type,
        description: op.description || op.type,
        amount,
        timestamp: op.date.toISOString(),
        memberName: member ? member.name : 'Sistema',
      };
    });
  }
}
