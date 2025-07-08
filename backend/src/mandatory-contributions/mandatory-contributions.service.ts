import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MandatoryContribution } from './entities/mandatory-contribution.entity';
import { CreateMandatoryContributionDto } from './dto/create-mandatory-contribution.dto';
import { UpdateMandatoryContributionDto } from './dto/update-mandatory-contribution.dto';

@Injectable()
export class MandatoryContributionsService {
  constructor(
    @InjectRepository(MandatoryContribution)
    private readonly mandatoryContributionRepository: Repository<MandatoryContribution>,
  ) {}

  create(
    createDto: CreateMandatoryContributionDto,
  ): Promise<MandatoryContribution> {
    const contribution = this.mandatoryContributionRepository.create(createDto);
    return this.mandatoryContributionRepository.save(contribution);
  }

  findAll(): Promise<MandatoryContribution[]> {
    return this.mandatoryContributionRepository.find();
  }

  async findOne(id: string): Promise<MandatoryContribution> {
    const contribution = await this.mandatoryContributionRepository.findOneBy({
      id,
    });
    if (!contribution) {
      throw new NotFoundException(`Mandatory Contribution #${id} not found`);
    }
    return contribution;
  }

  async update(
    id: string,
    updateDto: UpdateMandatoryContributionDto,
  ): Promise<MandatoryContribution> {
    await this.mandatoryContributionRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.mandatoryContributionRepository.delete(id);
  }
}
