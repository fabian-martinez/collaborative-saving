import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { StockSubscription } from './entities/stock-subscription.entity';
import { CreateStockSubscriptionDto } from './dto/create-stock-subscription.dto';
import { UpdateStockSubscriptionDto } from './dto/update-stock-subscription.dto';

@Injectable()
export class StockSubscriptionsService {
  constructor(
    @InjectRepository(StockSubscription)
    private readonly stockSubscriptionRepository: Repository<StockSubscription>,
  ) {}

  async create(
    createStockSubscriptionDto: CreateStockSubscriptionDto,
    queryRunner?: QueryRunner,
  ): Promise<StockSubscription> {
    const { member_id, stock_id, quantity } = createStockSubscriptionDto;
    const repository = queryRunner
      ? queryRunner.manager.getRepository(StockSubscription)
      : this.stockSubscriptionRepository;

    const existingSubscription = await repository.findOne({
      where: { member_id, stock_id },
    });

    if (existingSubscription) {
      existingSubscription.quantity += quantity;
      return repository.save(existingSubscription);
    }

    const newSubscription = repository.create({
      member_id,
      stock_id,
      quantity,
    });
    return repository.save(newSubscription);
  }

  findAll(): Promise<StockSubscription[]> {
    return this.stockSubscriptionRepository.find();
  }

  findAllWithDetails(): Promise<StockSubscription[]> {
    return this.stockSubscriptionRepository.find({ relations: ['stock'] });
  }

  findByMember(memberId: string): Promise<StockSubscription[]> {
    return this.stockSubscriptionRepository.find({
      where: { member_id: memberId },
      relations: ['stock'],
    });
  }

  async findOne(id: string): Promise<StockSubscription> {
    const subscription = await this.stockSubscriptionRepository.findOneBy({
      id,
    });
    if (!subscription) {
      throw new NotFoundException(`StockSubscription #${id} not found`);
    }
    return subscription;
  }

  findActiveByMember(memberId: string): Promise<StockSubscription[]> {
    return this.stockSubscriptionRepository.find({
      where: {
        member_id: memberId,
        status: 'active',
      },
      relations: ['stock'],
    });
  }

  async update(
    id: string,
    updateDto: UpdateStockSubscriptionDto,
  ): Promise<StockSubscription> {
    const subscription = await this.stockSubscriptionRepository.preload({
      id,
      ...updateDto,
    });
    if (!subscription) {
      throw new NotFoundException(`StockSubscription #${id} not found`);
    }
    return this.stockSubscriptionRepository.save(subscription);
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.stockSubscriptionRepository.remove(subscription);
  }
}
