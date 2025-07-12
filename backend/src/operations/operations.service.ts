import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { LoansService } from '../loans/loans.service';
import { Operation } from './entities/operation.entity';

@Injectable()
export class OperationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly loansService: LoansService,
  ) {}

  async findOne(id: string): Promise<Operation> {
    const operation = await this.dataSource.manager
      .getRepository(Operation)
      .findOne({
        where: { id },
        relations: ['member', 'ledger_entries'],
      });

    if (!operation) {
      throw new NotFoundException(`Operation with ID "${id}" not found.`);
    }

    return operation;
  }

  async findAll(params: { meetingId?: string }): Promise<Operation[]> {
    const where = params.meetingId ? { meeting: { id: params.meetingId } } : {};
    return this.dataSource.manager.getRepository(Operation).find({
      where,
      relations: ['member', 'ledger_entries'],
    });
  }
}
