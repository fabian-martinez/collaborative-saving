import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { Loan as LoanDomain } from '@domain/entities/loan.entity';
import { Loan as LoanEntity } from '../entities/loan.entity';
import { LoanMapper } from '../mappers/loan.mapper';

@Injectable()
export class TypeOrmLoanRepository implements LoanRepository {
  private readonly logger = new Logger(TypeOrmLoanRepository.name);

  constructor(
    @InjectRepository(LoanEntity)
    private readonly repo: Repository<LoanEntity>,
  ) {}

  async findById(id: string): Promise<LoanDomain | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? LoanMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<LoanDomain[]> {
    const entities = await this.repo.find();
    const validLoans: LoanDomain[] = [];
    
    for (const entity of entities) {
      try {
        const loan = LoanMapper.toDomain(entity);
        validLoans.push(loan);
      } catch (error) {
        this.logger.warn(
          `Skipping invalid loan ${entity.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    
    return validLoans;
  }

  async findByMember(memberId: string): Promise<LoanDomain[]> {
    const entities = await this.repo.find({ where: { memberId } });
    const validLoans: LoanDomain[] = [];
    
    for (const entity of entities) {
      try {
        const loan = LoanMapper.toDomain(entity);
        validLoans.push(loan);
      } catch (error) {
        this.logger.warn(
          `Skipping invalid loan ${entity.id} for member ${memberId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    
    return validLoans;
  }

  async findActiveByMember(memberId: string): Promise<LoanDomain[]> {
    const entities = await this.repo.find({
      where: { memberId, status: In(['pending', 'active']) },
    });
    const validLoans: LoanDomain[] = [];
    
    for (const entity of entities) {
      try {
        const loan = LoanMapper.toDomain(entity);
        validLoans.push(loan);
      } catch (error) {
        this.logger.warn(
          `Skipping invalid loan ${entity.id} for member ${memberId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    
    return validLoans;
  }

  async findPendingByMember(memberId: string): Promise<LoanDomain[]> {
    const entities = await this.repo.find({
      where: { memberId, status: 'pending' },
    });
    const validLoans: LoanDomain[] = [];
    
    for (const entity of entities) {
      try {
        const loan = LoanMapper.toDomain(entity);
        validLoans.push(loan);
      } catch (error) {
        this.logger.warn(
          `Skipping invalid loan ${entity.id} for member ${memberId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    
    return validLoans;
  }

  async save(loan: LoanDomain): Promise<LoanDomain> {
    const persistence = LoanMapper.toPersistence(loan);
    const existing = await this.repo.findOne({ where: { id: loan.id } });

    if (existing) {
      await this.repo.update(loan.id, persistence);
      const updated = await this.repo.findOne({ where: { id: loan.id } });
      if (!updated) {
        throw new Error('Loan not found after update');
      }
      return LoanMapper.toDomain(updated);
    } else {
      const saved = await this.repo.save(persistence as LoanEntity);
      return LoanMapper.toDomain(saved);
    }
  }

  async findByIds(ids: string[]): Promise<LoanDomain[]> {
    const entities = await this.repo.find({ where: { id: In(ids) } });
    const validLoans: LoanDomain[] = [];
    
    for (const entity of entities) {
      try {
        const loan = LoanMapper.toDomain(entity);
        validLoans.push(loan);
      } catch (error) {
        this.logger.warn(
          `Skipping invalid loan ${entity.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    
    return validLoans;
  }
}
