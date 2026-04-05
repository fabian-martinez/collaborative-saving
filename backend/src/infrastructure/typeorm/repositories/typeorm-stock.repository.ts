import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Stock as StockDomain } from '@domain/entities/stock.entity';
import { Stock as StockEntity } from '../entities/stock.entity';
import { StockMapper } from '../mappers/stock.mapper';

@Injectable()
export class TypeOrmStockRepository implements StockRepository {
  constructor(
    @InjectRepository(StockEntity)
    private readonly repo: Repository<StockEntity>,
  ) {}

  async findById(id: string): Promise<StockDomain | null> {
    const entity = await this.repo.findOne({
      where: { id, deleted_at: IsNull() },
    });
    return entity ? StockMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<StockDomain[]> {
    if (!ids || ids.length === 0) return [];

    const entities = await this.repo.find({
      where: { id: In(ids), deleted_at: IsNull() },
    });

    return entities.map((e) => StockMapper.toDomain(e));
  }

  async findByType(type: string): Promise<StockDomain | null> {
    const entity = await this.repo.findOne({
      where: { type, deleted_at: IsNull() },
    });
    return entity ? StockMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StockDomain[]> {
    const entities = await this.repo.find({
      where: { deleted_at: IsNull() },
    });
    return entities.map((e) => StockMapper.toDomain(e));
  }

  async findActive(): Promise<StockDomain[]> {
    return this.findAll();
  }

  async findByIds(ids: string[]): Promise<StockDomain[]> {
    if (!ids || ids.length === 0) return [];

    // TypeORM requires In() array from "typeorm" to be imported, let's see if it's imported
    // if not we will fix it in the next step
    const entities = await this.repo.find({
      where: { id: In(ids), deleted_at: IsNull() },
    });
    return entities.map((e) => StockMapper.toDomain(e));
  }

  async saveMany(stocks: StockDomain[]): Promise<StockDomain[]> {
    if (!stocks || stocks.length === 0) return [];

    const persistences = stocks.map((s) => StockMapper.toPersistence(s));
    const ids = stocks.map((s) => s.id);

    // Fetch existing entities to merge updates
    const existingEntities = await this.repo.find({
      where: { id: In(ids) },
      withDeleted: true,
    });

    const existingMap = new Map(existingEntities.map((e) => [e.id, e]));

    const entitiesToSave = persistences.map((persistence) => {
      const existing = existingMap.get(persistence.id);
      if (existing) {
        return this.repo.merge(existing, persistence as any);
      }
      return persistence as StockEntity;
    });

    const saved = await this.repo.save(entitiesToSave);
    return saved.map((e) => StockMapper.toDomain(e));
  }

  async save(stock: StockDomain): Promise<StockDomain> {
    const persistence = StockMapper.toPersistence(stock);

    // Check if stock exists in DB
    const existing = await this.repo.findOne({
      where: { id: stock.id },
      withDeleted: true,
    });

    if (existing) {
      // Update existing stock
      // Optimization: merge changes and save to avoid extra DB roundtrip (update + findOne)
      const updatedEntity = this.repo.merge(
        existing,
        persistence as StockEntity,
      );
      const saved = await this.repo.save(updatedEntity);
      return StockMapper.toDomain(saved);
    } else {
      // Insert new stock
      const saved = await this.repo.save(persistence as StockEntity);
      return StockMapper.toDomain(saved);
    }
  }

  async findGuaranteed(): Promise<StockDomain[]> {
    const entities = await this.repo.find({
      where: { is_guaranteed: true, deleted_at: IsNull() },
    });
    return entities.map((e) => StockMapper.toDomain(e));
  }
}
