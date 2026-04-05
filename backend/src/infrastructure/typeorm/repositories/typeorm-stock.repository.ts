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

  async save(stock: StockDomain): Promise<StockDomain> {
    const persistence = StockMapper.toPersistence(stock);
    const saved = await this.repo.save(persistence as StockEntity);
    return StockMapper.toDomain(saved);
  }

  async findGuaranteed(): Promise<StockDomain[]> {
    const entities = await this.repo.find({
      where: { is_guaranteed: true, deleted_at: IsNull() },
    });
    return entities.map((e) => StockMapper.toDomain(e));
  }
}
