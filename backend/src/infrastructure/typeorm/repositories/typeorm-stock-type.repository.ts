import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTypeRepository } from '@domain/ports/repositories/stock-type-repository.port';
import { StockType as StockTypeDomain } from '@domain/entities/stock-type.entity';
import { StockType as StockTypeEntity } from '../entities/stock-type.entity';
import { StockTypeMapper } from '../mappers/stock-type.mapper';

@Injectable()
export class TypeOrmStockTypeRepository implements StockTypeRepository {
  constructor(
    @InjectRepository(StockTypeEntity)
    private readonly repo: Repository<StockTypeEntity>,
  ) {}

  async findAll(): Promise<StockTypeDomain[]> {
    const entities = await this.repo.find();
    return entities.map((e) => StockTypeMapper.toDomain(e));
  }

  async findById(id: string): Promise<StockTypeDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? StockTypeMapper.toDomain(entity) : null;
  }

  async save(stockType: StockTypeDomain): Promise<StockTypeDomain> {
    const persistence = StockTypeMapper.toPersistence(stockType);
    const saved = await this.repo.save(persistence as StockTypeEntity);
    return StockTypeMapper.toDomain(saved);
  }

  async findByStockId(stockId: string): Promise<StockTypeDomain | null> {
    const entity = await this.repo
      .createQueryBuilder('stockType')
      .innerJoin('stockType.stocks', 'stock')
      .where('stock.id = :stockId', { stockId })
      .getOne();
    return entity ? StockTypeMapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
