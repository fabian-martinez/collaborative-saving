import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Meeting } from '../meetings/entities/meeting.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  FEE_INCOME_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '../common/constants/account-types';
import { StockValueHistory } from '../stocks/entities/stock-value-history.entity';
import { Operation } from '../operations/entities/operation.entity';
import {
  INVESTMENT_IN_STOCKS_ACCOUNT,
  REVALUATION_SURPLUS_ACCOUNT,
} from '../common/constants/account-types';

export interface RevaluationDetail {
  stock_id: string;
  type: string;
  is_guaranteed: boolean;
  previous_value: number;
  growth_from_contributions: number;
  growth_from_interest: number;
  total_growth_per_share: number;
  new_value: number;
}

export interface RevaluationPreviewResult {
  total_contributions: number;
  total_interest: number;
  total_to_distribute: number;
  details: RevaluationDetail[];
}

@Injectable()
export class AssetRevaluationService {
  private readonly logger = new Logger(AssetRevaluationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  async getRevaluationPreview(
    meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    const meeting = await this.meetingRepository.findOneBy({ id: meetingId });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found.`);
    }

    const ledgerEntries = await this.dataSource.manager.find(LedgerEntry, {
      where: { operation: { meeting_id: meetingId } },
    });

    const totalInterest = ledgerEntries
      .filter((e) =>
        [INTEREST_INCOME_ACCOUNT, FEE_INCOME_ACCOUNT].includes(e.account_type),
      )
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const totalContributions = ledgerEntries
      .filter((e) =>
        [MANDATORY_CONTRIBUTION_INCOME_ACCOUNT, STOCK_CAPITAL_ACCOUNT].includes(
          e.account_type,
        ),
      )
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const stocks = await this.dataSource.manager.find(Stock);
    const subscriptions = await this.dataSource.manager.find(StockSubscription);

    const details: RevaluationDetail[] = [];
    let interestAvailableToDistribute = totalInterest;

    // 1. Calculate growth for guaranteed stocks
    const guaranteedStocks = stocks.filter((s) => s.is_guaranteed);

    for (const stock of guaranteedStocks) {
      const growthFromInterest =
        Number(stock.value) * Number(stock.guaranteed_yield);
      interestAvailableToDistribute -= growthFromInterest;

      const newValue = Number(stock.value) + growthFromInterest;

      details.push({
        stock_id: stock.id,
        type: stock.type,
        is_guaranteed: true,
        previous_value: Number(stock.value),
        growth_from_contributions: 0, // Guaranteed stocks don't grow from contributions
        growth_from_interest: growthFromInterest,
        total_growth_per_share: growthFromInterest,
        new_value: newValue,
      });
    }

    // 2. Distribute remaining growth among non-guaranteed stocks
    const regularStocks = stocks.filter((s) => !s.is_guaranteed);
    const totalValueOfRegularStocks = regularStocks.reduce((sum, stock) => {
      const totalQuantityForStock = subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((qtySum, sub) => qtySum + sub.quantity, 0);
      return sum + Number(stock.value) * totalQuantityForStock;
    }, 0);

    if (totalValueOfRegularStocks > 0) {
      const interestRate =
        interestAvailableToDistribute / totalValueOfRegularStocks;

      for (const stock of regularStocks) {
        const growthFromInterest = Number(stock.value) * interestRate;
        const growthFromContributions =
          Number(stock.value) + Number(stock.monthly_contribution);
        const totalGrowth = growthFromInterest + growthFromContributions;
        const newValue = Number(stock.value) + totalGrowth;

        details.push({
          stock_id: stock.id,
          type: stock.type,
          is_guaranteed: false,
          previous_value: Number(stock.value),
          growth_from_contributions: growthFromContributions,
          growth_from_interest: growthFromInterest,
          total_growth_per_share: totalGrowth,
          new_value: newValue,
        });
      }
    }

    return {
      total_contributions: totalContributions,
      total_interest: totalInterest,
      total_to_distribute: totalContributions + totalInterest,
      details,
    };
  }

  async executeRevaluation(
    meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    const preview = await this.getRevaluationPreview(meetingId);
    const { total_contributions, total_interest, details } = preview;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const meeting = await queryRunner.manager.findOneByOrFail(Meeting, {
        id: meetingId,
      });

      // 1. Create the master Revaluation Operation
      const revaluationOperation = queryRunner.manager.create(Operation, {
        meeting_id: meetingId,
        type: 'ASSET_REVALUATION',
        amount: preview.total_to_distribute,
        date: meeting.date,
        description: `Revaluación de activos para la reunión del ${meeting.date.toLocaleDateString()}`,
      });
      await queryRunner.manager.save(revaluationOperation);

      // 2. Create history records and update stock values
      for (const detail of details) {
        const historyEntry = queryRunner.manager.create(StockValueHistory, {
          stock_id: detail.stock_id,
          operation_id: revaluationOperation.id,
          previous_value: detail.previous_value,
          growth_from_contributions: detail.growth_from_contributions,
          growth_from_interest: detail.growth_from_interest,
          total_growth_per_share: detail.total_growth_per_share,
          new_value: detail.new_value,
        });
        await queryRunner.manager.save(historyEntry);

        await queryRunner.manager.update(Stock, detail.stock_id, {
          value: detail.new_value,
        });
      }

      // 3. Create Ledger Entries for the revaluation, split by source
      const ledgerEntries: LedgerEntry[] = [];

      // Entries for contributions
      if (total_contributions > 0) {
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id: revaluationOperation.id,
            account_type: INVESTMENT_IN_STOCKS_ACCOUNT,
            amount: total_contributions,
            description: 'Aumento de valor por aportes de capital.',
          }),
          queryRunner.manager.create(LedgerEntry, {
            operation_id: revaluationOperation.id,
            account_type: REVALUATION_SURPLUS_ACCOUNT,
            amount: -total_contributions,
            description: 'Contrapartida por aportes de capital.',
          }),
        );
      }

      // Entries for interest
      if (total_interest > 0) {
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id: revaluationOperation.id,
            account_type: INVESTMENT_IN_STOCKS_ACCOUNT,
            amount: total_interest,
            description: 'Aumento de valor por rendimiento de intereses.',
          }),
          queryRunner.manager.create(LedgerEntry, {
            operation_id: revaluationOperation.id,
            account_type: REVALUATION_SURPLUS_ACCOUNT,
            amount: -total_interest,
            description: 'Contrapartida por rendimiento de intereses.',
          }),
        );
      }

      await queryRunner.manager.save(ledgerEntries);

      await queryRunner.commitTransaction();

      return preview;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to execute revaluation for meeting ${meetingId}`,
        err instanceof Error ? err.stack : err,
      );
      throw new BadRequestException(
        `Revaluation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
