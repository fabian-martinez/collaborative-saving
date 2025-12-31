import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { StockValueHistory as StockValueHistoryDomain } from '@domain/entities/stock-value-history.entity';
import { StockValueHistory as StockValueHistoryEntity } from '../entities/stock-value-history.entity';
import { StockValueHistoryMapper } from '../mappers/stock-value-history.mapper';

@Injectable()
export class TypeOrmStockValueHistoryRepository implements StockValueHistoryRepository {
  constructor(
    @InjectRepository(StockValueHistoryEntity)
    private readonly repo: Repository<StockValueHistoryEntity>,
  ) {}

  async findById(id: string): Promise<StockValueHistoryDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? StockValueHistoryMapper.toDomain(entity) : null;
  }

  async findByStock(stockId: string): Promise<StockValueHistoryDomain[]> {
    const entities = await this.repo.find({
      where: { stockId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => StockValueHistoryMapper.toDomain(e));
  }

  async findByOperation(
    operationId: string,
  ): Promise<StockValueHistoryDomain[]> {
    const entities = await this.repo.find({
      where: { operationId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => StockValueHistoryMapper.toDomain(e));
  }

  async findLatestByStock(
    stockId: string,
  ): Promise<StockValueHistoryDomain | null> {
    const entity = await this.repo.findOne({
      where: { stockId },
      order: { createdAt: 'DESC' },
    });
    return entity ? StockValueHistoryMapper.toDomain(entity) : null;
  }

  async findByStockBeforeDate(
    stockId: string,
    date: Date,
  ): Promise<StockValueHistoryDomain | null> {
    const entity = await this.repo.findOne({
      where: { stockId, createdAt: LessThan(date) },
      order: { createdAt: 'DESC' },
    });
    return entity ? StockValueHistoryMapper.toDomain(entity) : null;
  }

  async save(
    history: StockValueHistoryDomain,
  ): Promise<StockValueHistoryDomain> {
    const persistence = StockValueHistoryMapper.toPersistence(history);
    const existing = await this.repo.findOne({ where: { id: history.id } });

    if (existing) {
      await this.repo.update(history.id, persistence);
      const updated = await this.repo.findOne({ where: { id: history.id } });
      if (!updated) {
        throw new Error('StockValueHistory not found after update');
      }
      return StockValueHistoryMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(
        persistence as StockValueHistoryEntity,
      );
      return StockValueHistoryMapper.toDomain(saved);
    }
  }

  async saveMany(
    histories: StockValueHistoryDomain[],
  ): Promise<StockValueHistoryDomain[]> {
    const persistences = histories.map((h) =>
      StockValueHistoryMapper.toPersistence(h),
    );
    const saved = await this.repo.save(
      persistences as StockValueHistoryEntity[],
    );
    return saved.map((e) => StockValueHistoryMapper.toDomain(e));
  }
}
