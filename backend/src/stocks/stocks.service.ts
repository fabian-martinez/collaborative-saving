import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  findAll(): Promise<Stock[]> {
    return this.stocksRepository.find();
  }

  async findOne(id: string): Promise<Stock> {
    const stock = await this.stocksRepository.findOneBy({ id });
    if (!stock) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
    return stock;
  }

  async update(id: string, updateStockDto: UpdateStockDto): Promise<Stock> {
    await this.stocksRepository.update(id, updateStockDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.stocksRepository.delete(id);
  }
}
