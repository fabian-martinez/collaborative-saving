import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
      where: { id, deletedAt: IsNull() },
      relations: ['stockType'],
    });
    return entity ? StockMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<StockDomain | null> {
    const entity = await this.repo.findOne({
      where: { name, deletedAt: IsNull() },
      relations: ['stockType'],
    });
    return entity ? StockMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<StockDomain[]> {
    const entities = await this.repo.find({
      where: { deletedAt: IsNull() },
      relations: ['stockType'],
    });
    return entities.map((e) => StockMapper.toDomain(e));
  }

  async findActive(): Promise<StockDomain[]> {
    return this.findAll();
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
      await this.repo.update(stock.id, persistence);
      const updated = await this.repo.findOne({
        where: { id: stock.id },
        relations: ['stockType'],
        withDeleted: true,
      });
      if (!updated) {
        throw new Error('Stock not found after update');
      }
      return StockMapper.toDomain(updated);
    } else {
      // Insert new stock
      const saved = await this.repo.save(persistence as StockEntity);
      const withRelations = await this.repo.findOne({
        where: { id: saved.id },
        relations: ['stockType'],
      });
      return StockMapper.toDomain(withRelations!);
    }
  }

  // find stocks that are guaranteed stock type is guaranteed
  async findGuaranteed(): Promise<StockDomain[]> {
    const stocks = await this.repo.find({
      relations: ['stockType'],
      where: {
        stockType: {
          isGuaranteed: true,
        },
        deletedAt: IsNull(),
      },
    });
    return stocks.map((stock) => StockMapper.toDomain(stock));
  }

  async countByStockType(stockTypeId: string): Promise<number> {
    return this.repo.count({ where: { stockTypeId } });
  }
}
