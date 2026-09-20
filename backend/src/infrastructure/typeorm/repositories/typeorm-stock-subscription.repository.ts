import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockSubscription as StockSubscriptionDomain } from '@domain/entities/stock-subscription.entity';
import { StockSubscription as StockSubscriptionEntity } from '../entities/stock-subscription.entity';
import { StockSubscriptionMapper } from '../mappers/stock-subscription.mapper';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { TRANSACTION_MANAGER } from '@domain/constants/injection-tokens';

@Injectable()
export class TypeOrmStockSubscriptionRepository implements StockSubscriptionRepository {
  constructor(
    @InjectRepository(StockSubscriptionEntity)
    private readonly repo: Repository<StockSubscriptionEntity>,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Get the repository to use (with or without active transaction)
   */
  private getRepository(): Repository<StockSubscriptionEntity> {
    const activeQueryRunner = this.transactionManager.getActiveQueryRunner();
    if (activeQueryRunner) {
      return activeQueryRunner.manager.getRepository(
        StockSubscriptionEntity,
      ) as Repository<StockSubscriptionEntity>;
    }
    return this.repo;
  }

  async findById(id: string): Promise<StockSubscriptionDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({ where: { id } });
    return entity ? StockSubscriptionMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<StockSubscriptionDomain[]> {
    if (!ids || ids.length === 0) return [];
    const repo = this.getRepository();
    const entities = await repo.find({ where: { id: In(ids) } });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async findByMemberAndStock(
    memberId: string,
    stockId: string,
  ): Promise<StockSubscriptionDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({
      where: { memberId, stockId },
    });
    return entity ? StockSubscriptionMapper.toDomain(entity) : null;
  }

  async findAllByMemberAndStock(
    memberId: string,
    stockId: string,
  ): Promise<StockSubscriptionDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { memberId, stockId },
    });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async findByMember(memberId: string): Promise<StockSubscriptionDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({ where: { memberId } });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async findActiveByMember(
    memberId: string,
  ): Promise<StockSubscriptionDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { memberId, status: 'active' },
    });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async findFreeOfFinancing(
    memberId: string,
  ): Promise<StockSubscriptionDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { memberId, financingLoanId: IsNull() },
    });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async findByMemberAndStockAndNoLoan(
    memberId: string,
    stockId: string,
  ): Promise<StockSubscriptionDomain | null> {
    const repo = this.getRepository();
    const entity = await repo.findOne({
      where: {
        memberId,
        stockId,
        financingLoanId: IsNull(),
        status: 'active',
      },
    });
    return entity ? StockSubscriptionMapper.toDomain(entity) : null;
  }

  async findByFinancingLoan(
    financingLoanId: string,
  ): Promise<StockSubscriptionDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { financingLoanId, status: 'active' },
    });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async save(
    stockSubscription: StockSubscriptionDomain,
  ): Promise<StockSubscriptionDomain> {
    const repo = this.getRepository();
    const persistence =
      StockSubscriptionMapper.toPersistence(stockSubscription);
    const existing = await repo.findOne({
      where: { id: stockSubscription.id },
    });

    if (existing) {
      await repo.update(stockSubscription.id, persistence);
      const updated = await repo.findOne({
        where: { id: stockSubscription.id },
      });
      if (!updated) {
        throw new Error('StockSubscription not found after update');
      }
      return StockSubscriptionMapper.toDomain(updated);
    } else {
      const saved = await repo.save(persistence as StockSubscriptionEntity);
      return StockSubscriptionMapper.toDomain(saved);
    }
  }

  async saveMany(
    stockSubscriptions: StockSubscriptionDomain[],
  ): Promise<StockSubscriptionDomain[]> {
    const repo = this.getRepository();
    const persistences = stockSubscriptions.map((s) =>
      StockSubscriptionMapper.toPersistence(s),
    );
    const saved = await repo.save(persistences as StockSubscriptionEntity[]);
    return saved.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async findByStock(stockId: string): Promise<StockSubscriptionDomain[]> {
    const repo = this.getRepository();
    const entities = await repo.find({ where: { stockId } });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }

  async findByStocks(stockIds: string[]): Promise<StockSubscriptionDomain[]> {
    if (!stockIds || stockIds.length === 0) return [];
    const repo = this.getRepository();
    const entities = await repo.find({ where: { stockId: In(stockIds) } });
    return entities.map((e) => StockSubscriptionMapper.toDomain(e));
  }
}
