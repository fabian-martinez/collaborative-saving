import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LedgerEntry } from '../../../ledger-entries/entities/ledger-entry.entity';

@Injectable()
export class TypeOrmLedgerEntryRepository implements LedgerEntryRepository {
  constructor(
    @InjectRepository(LedgerEntry)
    private readonly repo: Repository<LedgerEntry>,
  ) {}

  async findById(id: string): Promise<LedgerEntry | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async save(entry: Partial<LedgerEntry>): Promise<LedgerEntry> {
    const entity = this.repo.create(entry);
    return await this.repo.save(entity);
  }

  async saveMany(entries: Partial<LedgerEntry>[]): Promise<LedgerEntry[]> {
    const entities = this.repo.create(entries);
    return await this.repo.save(entities);
  }
}
