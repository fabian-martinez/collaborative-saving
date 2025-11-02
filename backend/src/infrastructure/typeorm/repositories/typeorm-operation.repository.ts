import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { Operation as OperationDomain } from '@domain/entities/operation.entity';
import { Operation as OperationEntity } from '../entities/operation.entity';
import { OperationMapper } from '../mappers/operation.mapper';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';

@Injectable()
export class TypeOrmOperationRepository implements OperationRepository {
  constructor(
    @InjectRepository(OperationEntity)
    private readonly repo: Repository<OperationEntity>,
  ) {}

  // LedgerEntryRepository will be injected via setter or passed as parameter
  private ledgerEntryRepository?: LedgerEntryRepository;

  setLedgerEntryRepository(repo: LedgerEntryRepository): void {
    this.ledgerEntryRepository = repo;
  }

  async findById(id: string): Promise<OperationDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? OperationMapper.toDomain(entity) : null;
  }

  async findByMeeting(meetingId: string): Promise<OperationDomain[]> {
    const entities = await this.repo.find({ where: { meetingId } });
    return entities.map((e) => OperationMapper.toDomain(e));
  }

  async save(operation: OperationDomain): Promise<OperationDomain> {
    const persistence = OperationMapper.toPersistence(operation);
    const existing = await this.repo.findOne({ where: { id: operation.id } });

    if (existing) {
      await this.repo.update(operation.id, persistence);
      const updated = await this.repo.findOne({ where: { id: operation.id } });
      if (!updated) {
        throw new Error('Operation not found after update');
      }
      return OperationMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(persistence as OperationEntity);
      return OperationMapper.toDomain(saved);
    }
  }

  async saveWithEntries(
    operation: OperationDomain,
    entries: Array<{
      accountType: string;
      amount: number;
      description?: string | null;
    }>,
  ): Promise<OperationDomain> {
    // Save operation first
    const savedOperation = await this.save(operation);

    // Create and save ledger entries
    // Note: This method requires LedgerEntryRepository to be set via setLedgerEntryRepository
    if (!this.ledgerEntryRepository) {
      throw new Error(
        'LedgerEntryRepository not set. Call setLedgerEntryRepository first.',
      );
    }

    const ledgerEntries = entries.map((entry) =>
      LedgerEntry.create({
        operationId: savedOperation.id,
        accountType: entry.accountType,
        amount: entry.amount,
        description: entry.description,
      }),
    );

    await this.ledgerEntryRepository.saveMany(ledgerEntries);

    return savedOperation;
  }
}
