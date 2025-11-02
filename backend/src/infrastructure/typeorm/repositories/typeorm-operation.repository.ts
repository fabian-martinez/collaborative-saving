import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { Operation } from '../../../operations/entities/operation.entity';

@Injectable()
export class TypeOrmOperationRepository implements OperationRepository {
  constructor(
    @InjectRepository(Operation)
    private readonly repo: Repository<Operation>,
  ) {}

  async findById(id: string): Promise<Operation | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async save(operation: Partial<Operation>): Promise<Operation> {
    const entity = this.repo.create(operation);
    return await this.repo.save(entity);
  }
}
