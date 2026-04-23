import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { RecordOperationResponseDto } from '@application/dto/accounting/record-operation-response.dto';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';

/**
 * Record Operation Use Case
 *
 * Orchestrates the creation of an accounting operation and its associated
 * ledger entries with automatic balance validation and transactional execution.
 *
 * This use case ensures:
 * - All operations are recorded atomically (all or nothing)
 * - Double-entry bookkeeping balance is validated
 * - Proper error handling and rollback on failure
 */
export class RecordOperationUseCase {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly transactionManager: TransactionManager,
    private readonly balanceValidator: OperationBalanceValidator,
  ) {}

  async execute(dto: RecordOperationDto): Promise<RecordOperationResponseDto> {
    return this.transactionManager.execute(async () => {
      // 1. Create Operation domain entity
      const operation = Operation.create({
        memberId: dto.memberId ?? null,
        meetingId: dto.meetingId,
        type: dto.type,
        date: dto.date,
        description: dto.description,
      });

      // 2. Create LedgerEntry domain entities
      const ledgerEntries = dto.entries.map((entryDto) =>
        LedgerEntry.create({
          operationId: operation.id,
          accountType: entryDto.accountType,
          amount: entryDto.amount,
          description: entryDto.description,
          loanId: entryDto.loanId ?? null,
          stockId: entryDto.stockId ?? null,
          mandatoryContributionId: entryDto.mandatoryContributionId ?? null,
          stockSubscriptionId: entryDto.stockSubscriptionId ?? null,
        }),
      );

      // 3. Associate entries with operation and validate balance (débitos = créditos)
      // This will throw BusinessRuleError if balance is invalid
      operation.setEntries(ledgerEntries);

      // 4. Save Operation
      const savedOperation = await this.operationRepository.save(operation);

      // 5. Save LedgerEntries
      const savedEntries =
        await this.ledgerEntryRepository.saveMany(ledgerEntries);

      // 6. Return response
      return {
        operationId: savedOperation.id,
        ledgerEntryIds: savedEntries.map((entry) => entry.id),
      };
    });
  }
}
