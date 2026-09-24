import { Injectable } from '@nestjs/common';
import { OperationType } from '@domain/enums/operation-type.enum';
import { GetMemberStockModificationsQueryDto } from '@application/dto/members/get-member-stock-modifications-query.dto';
import { StockTransferResponseDto } from '@application/dto/members/stock-transfer-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { STOCK_CAPITAL_ACCOUNT } from '@domain/constants/account-types';

/**
 * Get Member Stock Transfers Query Handler
 *
 * Retrieves stock transfer operations made by a member (as origin), with optional filtering by meeting.
 */
@Injectable()
export class GetMemberStockTransfersQueryHandler {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async execute(
    memberId: string,
    query: GetMemberStockModificationsQueryDto,
  ): Promise<StockTransferResponseDto[]> {
    // Validate member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // Get STOCK_TRANSFER operations for the member (as origin)
    const operations = await this.operationRepository.findByMember(memberId, {
      meetingId: query.meetingId,
      types: [OperationType.STOCK_TRANSFER],
    });

    if (operations.length === 0) {
      return [];
    }

    // Get all ledger entries for these operations
    const operationIds = operations.map((op) => op.id);
    const allEntries =
      operationIds.length > 0
        ? await this.ledgerEntryRepository.findByOperations(operationIds)
        : [];

    // Group entries by operation
    const entriesByOperation = new Map<string, typeof allEntries>();
    for (const entry of allEntries) {
      const opId = entry.operationId;
      if (!entriesByOperation.has(opId)) {
        entriesByOperation.set(opId, []);
      }
      entriesByOperation.get(opId)!.push(entry);
    }

    // Get all unique stock IDs and subscription IDs from entries
    const stockIds = new Set<string>();
    const subscriptionIds = new Set<string>();

    for (const entry of allEntries) {
      if (entry.stockId) stockIds.add(entry.stockId);
      if (entry.stockSubscriptionId)
        subscriptionIds.add(entry.stockSubscriptionId);
    }

    // Fetch related entities
    const stocks = await this.stockRepository.findByIds(Array.from(stockIds));
    const subscriptions = await this.stockSubscriptionRepository.findByIds(
      Array.from(subscriptionIds),
    );

    // Create maps for quick lookup
    const stockMap = new Map(
      stocks
        .filter((stock): stock is NonNullable<typeof stock> => stock !== null)
        .map((stock) => [stock.id, stock]),
    );
    const subscriptionMap = new Map(
      subscriptions
        .filter((sub): sub is NonNullable<typeof sub> => sub !== null)
        .map((sub) => [sub.id, sub]),
    );

    // Build response DTOs
    const transfers: StockTransferResponseDto[] = [];

    for (const operation of operations) {
      const entries = entriesByOperation.get(operation.id) || [];

      // Find stock capital entry for the origin (positive amount = debit = reduction)
      const originEntry = entries.find(
        (e) => e.accountType === STOCK_CAPITAL_ACCOUNT && e.amount > 0,
      );

      if (!originEntry || !originEntry.stockSubscriptionId) {
        continue;
      }

      const fromSubscription = subscriptionMap.get(
        originEntry.stockSubscriptionId,
      );
      if (!fromSubscription) {
        continue;
      }

      const stock = stockMap.get(fromSubscription.stockId);
      if (!stock) {
        continue;
      }

      // Find destination entry (negative amount = credit = increase)
      const destinationEntry = entries.find(
        (e) =>
          e.accountType === STOCK_CAPITAL_ACCOUNT &&
          e.amount < 0 &&
          e.stockSubscriptionId !== fromSubscription.id,
      );

      if (!destinationEntry || !destinationEntry.stockSubscriptionId) {
        continue;
      }

      const toSubscription = subscriptionMap.get(
        destinationEntry.stockSubscriptionId,
      );
      if (!toSubscription) {
        continue;
      }

      // Extract transfer value
      const value = Math.abs(originEntry.amount);
      const quantity = fromSubscription.quantity || value / stock.value;

      // Parse description to extract toMember info
      // Format: "Transferencia de X acciones a {memberName}"
      const description = operation.description || '';
      const toMemberMatch = description.match(/a\s+(.+)$/);
      const toMemberName = toMemberMatch ? toMemberMatch[1] : 'Desconocido';

      // Get toMember from subscription
      const toMember = await this.memberRepository.findById(
        toSubscription.memberId,
      );

      const transfer: StockTransferResponseDto = {
        operationId: operation.id,
        meetingId: operation.meetingId,
        date: operation.date,
        description,
        stockId: stock.id,
        stockType: stock.type,
        quantity,
        value,
        fromMemberId: memberId,
        fromMemberName: member.name,
        toMemberId: toSubscription.memberId,
        toMemberName: toMember?.name || toMemberName,
        fromSubscriptionId: fromSubscription.id,
        toSubscriptionId: toSubscription.id,
      };

      transfers.push(transfer);
    }

    // Sort by date descending
    transfers.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return transfers;
  }
}
