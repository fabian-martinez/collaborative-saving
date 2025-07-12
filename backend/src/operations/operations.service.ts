import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { LoansService } from '../loans/loans.service';
import { Operation } from './entities/operation.entity';
import { FindOperationsDto } from './dto/find-operations.dto';

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

  async findAll(
    params: FindOperationsDto,
  ): Promise<{ data: Operation[]; total: number }> {
    const repo = this.dataSource.manager.getRepository(Operation);
    const qb = repo
      .createQueryBuilder('operation')
      .leftJoinAndSelect('operation.member', 'member')
      .leftJoinAndSelect('operation.ledger_entries', 'ledger_entries');

    if (params.meetingId) {
      qb.andWhere('operation.meeting_id = :meetingId', {
        meetingId: params.meetingId,
      });
    }
    if (params.memberId) {
      qb.andWhere('operation.member_id = :memberId', {
        memberId: params.memberId,
      });
    }
    if (params.operationType) {
      qb.andWhere('operation.type = :type', { type: params.operationType });
    }
    if (params.dateFrom) {
      qb.andWhere('operation.date >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb.andWhere('operation.date <= :dateTo', { dateTo: params.dateTo });
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('operation.date', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
