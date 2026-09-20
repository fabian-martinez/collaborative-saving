import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { StockValueHistory as StockValueHistoryDomain } from '@domain/entities/stock-value-history.entity';
import { StockValueHistory as StockValueHistoryEntity } from '../entities/stock-value-history.entity';
import { StockValueHistoryMapper } from '../mappers/stock-value-history.mapper';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';

@Injectable()
export class TypeOrmStockValueHistoryRepository implements StockValueHistoryRepository {
  constructor(
    @InjectRepository(StockValueHistoryEntity)
    private readonly repo: Repository<StockValueHistoryEntity>,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Get the repository to use (with or without active transaction)
   */
  private getRepository(): Repository<StockValueHistoryEntity> {
    const activeQueryRunner = this.transactionManager.getActiveQueryRunner();
    if (activeQueryRunner) {
      return activeQueryRunner.manager.getRepository(
        StockValueHistoryEntity,
      ) as Repository<StockValueHistoryEntity>;
    }
    return this.repo;
  }

  async findById(id: string): Promise<StockValueHistoryDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({ where: { id } });
    return entity ? StockValueHistoryMapper.toDomain(entity) : null;
  }

  async findByStock(stockId: string): Promise<StockValueHistoryDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { stockId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => StockValueHistoryMapper.toDomain(e));
  }

  async findByOperation(
    operationId: string,
  ): Promise<StockValueHistoryDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { operationId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => StockValueHistoryMapper.toDomain(e));
  }

  async findLatestByStock(
    stockId: string,
  ): Promise<StockValueHistoryDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({
      where: { stockId },
      order: { createdAt: 'DESC' },
    });
    return entity ? StockValueHistoryMapper.toDomain(entity) : null;
  }

  async findByStockBeforeDate(
    stockId: string,
    date: Date,
  ): Promise<StockValueHistoryDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({
      where: { stockId, createdAt: LessThan(date) },
      order: { createdAt: 'DESC' },
    });
    return entity ? StockValueHistoryMapper.toDomain(entity) : null;
  }

  async save(
    history: StockValueHistoryDomain,
  ): Promise<StockValueHistoryDomain> {
    const repo = this.getRepository();
    const persistence = StockValueHistoryMapper.toPersistence(history);
    const existing = await repo.findOne({ where: { id: history.id } });

    if (existing) {
      await repo.update(history.id, persistence);
      const updated = await repo.findOne({ where: { id: history.id } });
      if (!updated) {
        throw new Error('StockValueHistory not found after update');
      }
      return StockValueHistoryMapper.toDomain(updated);
    } else {
      const saved = await repo.save(persistence as StockValueHistoryEntity);
      return StockValueHistoryMapper.toDomain(saved);
    }
  }

  async saveMany(
    histories: StockValueHistoryDomain[],
  ): Promise<StockValueHistoryDomain[]> {
    const repo = this.getRepository();
    const persistences = histories.map((h) =>
      StockValueHistoryMapper.toPersistence(h),
    );
    const saved = await repo.save(persistences as StockValueHistoryEntity[]);
    return saved.map((e) => StockValueHistoryMapper.toDomain(e));
  }
}
