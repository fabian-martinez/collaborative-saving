import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType as LoanTypeDomain } from '@domain/entities/loan-type.entity';
import { LoanType as LoanTypeEntity } from '../entities/loan-type.entity';
import { LoanTypeMapper } from '../mappers/loan-type.mapper';

@Injectable()
export class TypeOrmLoanTypeRepository implements LoanTypeRepository {
  constructor(
    @InjectRepository(LoanTypeEntity)
    private readonly repo: Repository<LoanTypeEntity>,
  ) {}

  async findAll(): Promise<LoanTypeDomain[]> {
    const entities = await this.repo.find();
    return entities.map((e) => LoanTypeMapper.toDomain(e));
  }

  async findById(id: string): Promise<LoanTypeDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? LoanTypeMapper.toDomain(entity) : null;
  }

  async save(loanType: LoanTypeDomain): Promise<LoanTypeDomain> {
    const persistence = LoanTypeMapper.toPersistence(loanType);
    const saved = await this.repo.save(persistence as LoanTypeEntity);
    return LoanTypeMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
