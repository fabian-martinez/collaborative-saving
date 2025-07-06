import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock)
    private readonly stocksRepository: Repository<Stock>,
  ) {}

  create(createStockDto: CreateStockDto): Promise<Stock> {
    const stock = this.stocksRepository.create(createStockDto);
    return this.stocksRepository.save(stock);
  }

  findAll(withDeleted = false): Promise<Stock[]> {
    return this.stocksRepository.find({
      withDeleted: withDeleted,
    });
  }

  findOnlyDeleted(): Promise<Stock[]> {
    return this.stocksRepository.find({
      withDeleted: true,
      where: {
        deleted_at: Not(IsNull()),
      },
    });
  }

  async findOne(id: string, withDeleted = false): Promise<Stock> {
    const stock = await this.stocksRepository.findOne({
      where: { id },
      withDeleted: withDeleted,
    });
    if (!stock) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
    return stock;
  }

  async update(id: string, updateStockDto: UpdateStockDto): Promise<Stock> {
    const stock = await this.stocksRepository.preload({
      id,
      ...updateStockDto,
    });
    if (!stock) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
    return this.stocksRepository.save(stock);
  }

  async remove(id: string): Promise<void> {
    const result = await this.stocksRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
  }

  async restore(id: string): Promise<void> {
    const result = await this.stocksRepository.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
  }
}
