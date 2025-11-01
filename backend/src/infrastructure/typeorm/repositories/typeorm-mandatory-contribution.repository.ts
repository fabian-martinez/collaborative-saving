import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { MandatoryContribution as MandatoryContributionDomain } from '@domain/entities/mandatory-contribution.entity';
import { MandatoryContribution as MandatoryContributionEntity } from '../entities/mandatory-contribution.entity';
import { MandatoryContributionMapper } from '../mappers/mandatory-contribution.mapper';

@Injectable()
export class TypeOrmMandatoryContributionRepository
  implements MandatoryContributionRepository
{
  constructor(
    @InjectRepository(MandatoryContributionEntity)
    private readonly repo: Repository<MandatoryContributionEntity>,
  ) {}

  async findById(id: string): Promise<MandatoryContributionDomain | null> {
    const entity = await this.repo.findOne({
      where: { id },
    });
    if (!entity) return null;
    return MandatoryContributionMapper.toDomain(entity);
  }

  async findByAssetType(
    assetType: string,
  ): Promise<MandatoryContributionDomain | null> {
    const entity = await this.repo.findOne({
      where: { assetType },
    });
    if (!entity) return null;
    return MandatoryContributionMapper.toDomain(entity);
  }

  async findAll(): Promise<MandatoryContributionDomain[]> {
    const entities = await this.repo.find();
    return entities.map((entity) =>
      MandatoryContributionMapper.toDomain(entity),
    );
  }

  async save(
    contribution: MandatoryContributionDomain,
  ): Promise<MandatoryContributionDomain> {
    const persistence = MandatoryContributionMapper.toPersistence(contribution);

    const existing = await this.repo.findOne({
      where: { id: contribution.id },
    });

    if (existing) {
      await this.repo.update(contribution.id, persistence);
      const updated = await this.repo.findOne({
        where: { id: contribution.id },
      });
      if (!updated) {
        throw new Error('MandatoryContribution not found after update');
      }
      return MandatoryContributionMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(
        persistence as MandatoryContributionEntity,
      );
      return MandatoryContributionMapper.toDomain(saved);
    }
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
