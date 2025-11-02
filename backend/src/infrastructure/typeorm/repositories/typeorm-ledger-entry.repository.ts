import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LedgerEntry as LedgerEntryDomain } from '@domain/entities/ledger-entry.entity';
import { LedgerEntry as LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { LedgerEntryMapper } from '../mappers/ledger-entry.mapper';
import { Operation as OperationEntity } from '../entities/operation.entity';

@Injectable()
export class TypeOrmLedgerEntryRepository implements LedgerEntryRepository {
  constructor(
    @InjectRepository(LedgerEntryEntity)
    private readonly repo: Repository<LedgerEntryEntity>,
    @InjectRepository(OperationEntity)
    private readonly operationRepo: Repository<OperationEntity>,
  ) {}

  async findById(id: string): Promise<LedgerEntryDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? LedgerEntryMapper.toDomain(entity) : null;
  }

  async findByOperation(operationId: string): Promise<LedgerEntryDomain[]> {
    const entities = await this.repo.find({ where: { operationId } });
    return entities.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async findByMeeting(meetingId: string): Promise<LedgerEntryDomain[]> {
    // Join with operations to filter by meeting
    const entities = await this.repo
      .createQueryBuilder('ledger_entry')
      .innerJoin('ledger_entry.operation', 'operation')
      .where('operation.meetingId = :meetingId', { meetingId })
      .getMany();
    return entities.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async findByAccountType(accountType: string): Promise<LedgerEntryDomain[]> {
    const entities = await this.repo.find({ where: { accountType } });
    return entities.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async save(entry: LedgerEntryDomain): Promise<LedgerEntryDomain> {
    const persistence = LedgerEntryMapper.toPersistence(entry);
    const existing = await this.repo.findOne({ where: { id: entry.id } });

    if (existing) {
      await this.repo.update(entry.id, persistence);
      const updated = await this.repo.findOne({ where: { id: entry.id } });
      if (!updated) {
        throw new Error('LedgerEntry not found after update');
      }
      return LedgerEntryMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(persistence as LedgerEntryEntity);
      return LedgerEntryMapper.toDomain(saved);
    }
  }

  async saveMany(entries: LedgerEntryDomain[]): Promise<LedgerEntryDomain[]> {
    const persistences = entries.map((e) => LedgerEntryMapper.toPersistence(e));
    const saved = await this.repo.save(persistences as LedgerEntryEntity[]);
    return saved.map((e) => LedgerEntryMapper.toDomain(e));
  }

  async sumByAccountType(accountType: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('ledger_entry')
      .select('SUM(ledger_entry.amount)', 'sum')
      .where('ledger_entry.accountType = :accountType', { accountType })
      .getRawOne<{ sum: string | null }>();

    return Number(result && result.sum ? result.sum : 0);
  }
}
