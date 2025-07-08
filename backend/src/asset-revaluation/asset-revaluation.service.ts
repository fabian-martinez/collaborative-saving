import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  INTEREST_INCOME_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '../common/constants/account-types';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { StockValueHistory } from '../stocks/entities/stock-value-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from '../meetings/entities/meeting.entity';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class AssetRevaluationService {
  private readonly logger = new Logger(AssetRevaluationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  async revaluateAssets(meetingId: string): Promise<{
    revaluationRate: number;
    newStockValues: { type: string; value: number }[];
  }> {
    const meeting = await this.meetingRepository.findOneBy({ id: meetingId });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${meetingId}" not found.`);
    }

    if (meeting.status !== 'active') {
      throw new BadRequestException(
        'Asset revaluation can only be performed on active meetings.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ledgerEntries = await queryRunner.manager.find(LedgerEntry, {
        relations: { operation: true },
        where: { operation: { meeting_id: meetingId } },
      });

      const totalInterestIncome = ledgerEntries
        .filter((e) => e.account_type === INTEREST_INCOME_ACCOUNT)
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

      const totalCapitalContributions = ledgerEntries
        .filter((e) => e.account_type === STOCK_CAPITAL_ACCOUNT)
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

      const masaADistribuir = totalInterestIncome + totalCapitalContributions;

      const allSubscriptions = await queryRunner.manager.find(
        StockSubscription,
        {
          relations: { stock: true },
        },
      );

      const capitalBaseTotal = allSubscriptions.reduce(
        (sum, s) => sum + s.quantity * Number(s.stock.value),
        0,
      );

      if (capitalBaseTotal === 0) {
        throw new BadRequestException(
          'Capital base is zero, cannot revaluate.',
        );
      }

      const revaluationRate = masaADistribuir / capitalBaseTotal;

      const stocks = await queryRunner.manager.find(Stock);
      const newStockValues: { type: string; value: number }[] = [];

      for (const stock of stocks) {
        const newValue = Number(stock.value) * (1 + revaluationRate);
        newStockValues.push({ type: stock.type, value: newValue });

        const historyEntry = queryRunner.manager.create(StockValueHistory, {
          stock_id: stock.id,
          value: newValue,
        });
        await queryRunner.manager.save(historyEntry);

        await queryRunner.manager.update(Stock, stock.id, { value: newValue });
      }

      await queryRunner.commitTransaction();

      return { revaluationRate, newStockValues };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error during asset revaluation', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
