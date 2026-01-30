import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterestDistributionConfigRepository } from '@domain/ports/repositories/interest-distribution-config-repository.port';
import { InterestDistributionConfig as InterestDistributionConfigDomain } from '@domain/entities/interest-distribution-config.entity';
import { InterestDistributionConfig as InterestDistributionConfigEntity } from '../entities/interest-distribution-config.entity';
import { InterestDistributionConfigMapper } from '../mappers/interest-distribution-config.mapper';

@Injectable()
export class TypeOrmInterestDistributionConfigRepository implements InterestDistributionConfigRepository {
  constructor(
    @InjectRepository(InterestDistributionConfigEntity)
    private readonly repo: Repository<InterestDistributionConfigEntity>,
  ) {}

  async findAll(): Promise<InterestDistributionConfigDomain[]> {
    const entities = await this.repo.find();
    return entities.map((e) => InterestDistributionConfigMapper.toDomain(e));
  }

  async findByLoanType(loanTypeId: string): Promise<InterestDistributionConfigDomain[]> {
    const entities = await this.repo.find({ where: { loanTypeId } });
    return entities.map((e) => InterestDistributionConfigMapper.toDomain(e));
  }

  async findByStockType(
    stockTypeId: string,
  ): Promise<InterestDistributionConfigDomain[]> {
    const entities = await this.repo.find({ where: { stockTypeId } });
    return entities.map((e) => InterestDistributionConfigMapper.toDomain(e));
  }

  async save(config: InterestDistributionConfigDomain): Promise<InterestDistributionConfigDomain> {
    const persistence = InterestDistributionConfigMapper.toPersistence(config);
    const saved = await this.repo.save(persistence as InterestDistributionConfigEntity);
    return InterestDistributionConfigMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
