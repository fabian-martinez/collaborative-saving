import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockSubscription } from '../../../stock-subscriptions/entities/stock-subscription.entity';

@Injectable()
export class TypeOrmStockSubscriptionRepository
  implements StockSubscriptionRepository
{
  constructor(
    @InjectRepository(StockSubscription)
    private readonly repo: Repository<StockSubscription>,
  ) {}

  async findById(id: string): Promise<StockSubscription | null> {
    return await this.repo.findOne({
      where: { id },
      relations: ['stock'],
    });
  }

  async findByMember(memberId: string): Promise<StockSubscription[]> {
    return await this.repo.find({
      where: { member_id: memberId },
      relations: ['stock'],
      order: { purchase_date: 'DESC' },
    });
  }

  async findActiveByMember(memberId: string): Promise<StockSubscription[]> {
    return await this.repo.find({
      where: {
        member_id: memberId,
        status: 'active',
      },
      relations: ['stock', 'financing_loan'],
      order: { purchase_date: 'DESC' },
    });
  }

  async save(subscription: StockSubscription): Promise<StockSubscription> {
    return await this.repo.save(subscription);
  }
}
