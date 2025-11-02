import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { Loan } from '../../../loans/entities/loan.entity';

@Injectable()
export class TypeOrmLoanRepository implements LoanRepository {
  constructor(
    @InjectRepository(Loan)
    private readonly repo: Repository<Loan>,
  ) {}

  async findById(id: string): Promise<Loan | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async findByMember(memberId: string): Promise<Loan[]> {
    return await this.repo.find({
      where: { member_id: memberId },
      order: { creation_date: 'DESC' },
    });
  }

  async findActiveByMember(memberId: string): Promise<Loan[]> {
    return await this.repo.find({
      where: {
        member_id: memberId,
        status: 'active',
      },
      order: { creation_date: 'DESC' },
    });
  }

  async save(loan: Loan): Promise<Loan> {
    return await this.repo.save(loan);
  }

  async update(id: string, data: Partial<Loan>): Promise<void> {
    await this.repo.update({ id }, data);
  }
}
