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
import { RevaluationDetail, RevaluationPreviewResult } from './types';
import { PendingMemberPayment } from '../meetings/entities/pending-member-payment.entity';
import { StockBehavior } from '../stocks/entities/stock.entity';

@Injectable()
export class AssetRevaluationService {
  private readonly logger = new Logger(AssetRevaluationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  private async _calculateRevaluationData(
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

    // Separar aportes por acción y aportes obligatorios
    const totalStockContributions = ledgerEntries
      .filter((e) => e.account_type === STOCK_CAPITAL_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const totalMandatoryContributions = ledgerEntries
      .filter((e) => e.account_type === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const stocks = await this.dataSource.manager.find(Stock);
    const subscriptions = await this.dataSource.manager.find(StockSubscription);

    const details: RevaluationDetail[] = [];
    let interestAvailableForDistribution = totalInterest;

    // 1. Calculate growth for guaranteed stocks
    const guaranteedStocks = stocks.filter((s) => s.is_guaranteed);
    let totalRequiredGuaranteedGrowth = 0;
    const guaranteedStockDetails: (RevaluationDetail & {
      required_growth: number;
    })[] = [];

    for (const stock of guaranteedStocks) {
      const totalShares = subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);

      if (totalShares === 0) continue;

      const requiredGrowthPerShare =
        Number(stock.value) * Number(stock.guaranteed_yield);
      totalRequiredGuaranteedGrowth += requiredGrowthPerShare * totalShares;

      guaranteedStockDetails.push({
        stock_id: stock.id,
        type: stock.type,
        is_guaranteed: true,
        total_shares: Number(totalShares),
        previous_value: Number(stock.value),
        required_growth: requiredGrowthPerShare,
        growth_from_contributions: 0,
        estimated_growth_from_contributions: Number(stock.monthly_contribution),
        growth_from_interest: 0, // Calculated below
        total_growth_per_share: 0, // Calculated below
        new_value: 0, // Calculated below
      });
    }

    // Distribute available interest to guaranteed stocks
    const growthForGuaranteedStocks = Math.min(
      interestAvailableForDistribution,
      totalRequiredGuaranteedGrowth,
    );
    interestAvailableForDistribution -= growthForGuaranteedStocks;

    const guaranteedGrowthRatio =
      totalRequiredGuaranteedGrowth > 0
        ? growthForGuaranteedStocks / totalRequiredGuaranteedGrowth
        : 0;

    for (const detail of guaranteedStockDetails) {
      const actualGrowth = detail.required_growth * guaranteedGrowthRatio;
      detail.growth_from_interest = actualGrowth;
      detail.total_growth_per_share = actualGrowth;
      detail.new_value = detail.previous_value + actualGrowth;
      details.push(detail);
    }

    // 2. Distribute remaining growth among non-guaranteed stocks
    const gainsForRegularStocks =
      interestAvailableForDistribution + totalStockContributions;
    const regularStocks = stocks.filter((s) => !s.is_guaranteed);

    const totalValueOfRegularStocks = regularStocks.reduce((sum, stock) => {
      const totalShares = subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((qtySum, sub) => qtySum + Number(sub.quantity), 0);
      return sum + Number(stock.value) * totalShares;
    }, 0);

    const regularGrowthRate =
      totalValueOfRegularStocks > 0
        ? gainsForRegularStocks / totalValueOfRegularStocks
        : 0;
    const interestProportion =
      gainsForRegularStocks > 0
        ? interestAvailableForDistribution / gainsForRegularStocks
        : 0;

    for (const stock of regularStocks) {
      const totalShares = subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);
      if (totalShares === 0) continue;
      const totalGrowthPerShare = Number(stock.value) * regularGrowthRate;
      const growthFromInterest = totalGrowthPerShare * interestProportion;
      const growthFromContributions = ledgerEntries
        .filter(
          (e) =>
            e.account_type === STOCK_CAPITAL_ACCOUNT && e.stock_id === stock.id,
        )
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
      const estimatedGrowthFromContributions = Number(
        stock.monthly_contribution,
      );
      let dividends_generated: number | undefined = undefined;
      let new_value: number;
      let total_growth_per_share: number;
      if (stock.behavior === StockBehavior.DIVIDEND_YIELD) {
        // Solo crece por aportes, no por intereses
        dividends_generated = growthFromInterest * totalShares;
        total_growth_per_share = growthFromContributions / totalShares;
        new_value = Number(stock.value) + total_growth_per_share;
      } else {
        total_growth_per_share = totalGrowthPerShare;
        new_value = Number(stock.value) + Number(totalGrowthPerShare);
      }
      details.push({
        stock_id: stock.id,
        type: stock.type,
        is_guaranteed: false,
        total_shares: Number(totalShares),
        previous_value: Number(stock.value),
        growth_from_contributions: growthFromContributions / totalShares,
        growth_from_interest: growthFromInterest,
        total_growth_per_share,
        estimated_growth_from_contributions: estimatedGrowthFromContributions,
        new_value,
        dividends_generated,
      });
    }

    // Agrupar aportes obligatorios por tipo
    const mandatoryContributionMap: Record<
      string,
      { total: number; mandatory_contribution_id: string }
    > = {};
    ledgerEntries
      .filter(
        (e) =>
          e.account_type === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT &&
          typeof e.mandatory_contribution_id === 'string' &&
          e.mandatory_contribution_id,
      )
      .forEach((e) => {
        const id = e.mandatory_contribution_id as string;
        if (!mandatoryContributionMap[id]) {
          mandatoryContributionMap[id] = {
            total: 0,
            mandatory_contribution_id: id,
          };
        }
        mandatoryContributionMap[id].total += Math.abs(Number(e.amount));
      });
    const mandatoryContributionsByType = Object.values(
      mandatoryContributionMap,
    );

    return {
      total_contributions: totalStockContributions,
      total_interest: totalInterest,
      total_to_distribute: totalStockContributions + totalInterest,
      details: details.sort((a, b) => a.type.localeCompare(b.type)),
      total_mandatory_contributions: totalMandatoryContributions,
      mandatory_contributions_by_type: mandatoryContributionsByType,
    };
  }

  private async _getExecutedRevaluationData(
    operationId: string,
    meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    // Obtener el historial de revaluación ejecutada
    const stockHistories = await this.dataSource.manager.find(
      StockValueHistory,
      {
        where: { operation_id: operationId },
        relations: ['stock'],
      },
    );

    // Reconstruir los detalles de la revaluación ejecutada
    const details: RevaluationDetail[] = [];
    const stocks = await this.dataSource.manager.find(Stock);
    const subscriptions = await this.dataSource.manager.find(StockSubscription);

    for (const history of stockHistories) {
      const stock = stocks.find((s) => s.id === history.stock_id);
      const totalShares = subscriptions
        .filter((sub) => sub.stock_id === history.stock_id)
        .reduce((sum, sub) => sum + sub.quantity, 0);

      if (stock) {
        details.push({
          stock_id: history.stock_id,
          type: stock.type,
          is_guaranteed: stock.is_guaranteed,
          total_shares: totalShares,
          previous_value: Number(history.previous_value),
          growth_from_contributions: Number(history.growth_from_contributions),
          growth_from_interest: Number(history.growth_from_interest),
          total_growth_per_share: Number(history.total_growth_per_share),
          estimated_growth_from_contributions: stock.monthly_contribution,
          new_value: Number(history.new_value),
        });
      }
    }

    // Get all edgers for the meeting
    const meetingLedgerEntries = await this.dataSource.manager.find(
      LedgerEntry,
      {
        where: { operation: { meeting_id: meetingId } },
      },
    );

    // Calcular totales desde los asientos contables
    const totalContributions = meetingLedgerEntries
      .filter((e) => e.account_type === STOCK_CAPITAL_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const totalInterest = meetingLedgerEntries
      .filter((e) =>
        [INTEREST_INCOME_ACCOUNT, FEE_INCOME_ACCOUNT].includes(e.account_type),
      )
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const totalMandatoryContributions = meetingLedgerEntries
      .filter((e) => e.account_type === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    // Agrupar aportes obligatorios por tipo
    const mandatoryContributionMap: Record<
      string,
      { total: number; mandatory_contribution_id: string }
    > = {};
    meetingLedgerEntries
      .filter(
        (e) =>
          e.account_type === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT &&
          e.mandatory_contribution_id,
      )
      .forEach((e) => {
        const id = e.mandatory_contribution_id as string;
        if (!mandatoryContributionMap[id]) {
          mandatoryContributionMap[id] = {
            total: 0,
            mandatory_contribution_id: id,
          };
        }
        mandatoryContributionMap[id].total += Math.abs(Number(e.amount));
      });

    return {
      total_contributions: totalContributions,
      total_interest: totalInterest,
      total_to_distribute: totalContributions + totalInterest,
      details: details.sort((a, b) => a.type.localeCompare(b.type)),
      total_mandatory_contributions: totalMandatoryContributions,
      mandatory_contributions_by_type: Object.values(mandatoryContributionMap),
    };
  }

  async getRevaluationPreview(
    meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    // Verificar si ya existe una revaluación ejecutada para esta reunión
    const existingRevaluation = await this.dataSource.manager.findOne(
      Operation,
      {
        where: {
          meeting_id: meetingId,
          type: 'ASSET_REVALUATION',
        },
      },
    );

    if (existingRevaluation) {
      // Si ya existe, devolver los datos de la revaluación ejecutada
      return this._getExecutedRevaluationData(
        existingRevaluation.id,
        meetingId,
      );
    }

    // Si no existe, calcular la nueva revaluación
    return this._calculateRevaluationData(meetingId);
  }

  async isRevaluationExecuted(meetingId: string): Promise<boolean> {
    const existingRevaluation = await this.dataSource.manager.findOne(
      Operation,
      {
        where: {
          meeting_id: meetingId,
          type: 'ASSET_REVALUATION',
        },
      },
    );

    return !!existingRevaluation;
  }

  async executeRevaluation(
    meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    // Verificar si ya existe una revaluación para esta reunión
    const existingRevaluation = await this.dataSource.manager.findOne(
      Operation,
      {
        where: {
          meeting_id: meetingId,
          type: 'ASSET_REVALUATION',
        },
      },
    );

    if (existingRevaluation) {
      throw new BadRequestException(
        'Ya se ha ejecutado la revaluación de activos para esta reunión',
      );
    }

    const preview = await this._calculateRevaluationData(meetingId);
    const { details } = preview;

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
        date: meeting.date,
        description: `Revaluación de activos para la reunión del ${meeting.date.toLocaleDateString()}`,
      });
      await queryRunner.manager.save(revaluationOperation);

      // 2. Create history records and update stock values
      for (const detail of details) {
        const stock = await queryRunner.manager.findOneByOrFail(Stock, {
          id: detail.stock_id,
        });
        // Si la acción es DIVIDEND_YIELD, no aumentar el valor, solo registrar historia con el mismo valor
        const isDividendYield = stock.behavior === StockBehavior.DIVIDEND_YIELD;
        const newValue = isDividendYield
          ? detail.previous_value
          : detail.new_value;
        const historyEntry = queryRunner.manager.create(StockValueHistory, {
          stock_id: detail.stock_id,
          operation_id: revaluationOperation.id,
          previous_value: detail.previous_value,
          growth_from_contributions: detail.growth_from_contributions,
          growth_from_interest: detail.growth_from_interest,
          total_growth_per_share: detail.total_growth_per_share,
          new_value: newValue,
        });
        await queryRunner.manager.save(historyEntry);
        await queryRunner.manager.update(Stock, detail.stock_id, {
          value: newValue,
        });
      }

      // 3. Create Ledger Entries for the revaluation, split by source
      const ledgerEntries: LedgerEntry[] = [];
      // Asientos por cada tipo de acción revalorizada
      for (const detail of details) {
        const stock = await queryRunner.manager.findOneByOrFail(Stock, {
          id: detail.stock_id,
        });
        const isDividendYield = stock.behavior === StockBehavior.DIVIDEND_YIELD;
        if (isDividendYield) {
          // Generar dividendos: distribuir growth_from_interest como dividendos
          if (detail.growth_from_interest > 0) {
            // Obtener suscripciones activas para esta acción
            const subscriptions = await queryRunner.manager.find(
              StockSubscription,
              { where: { stock_id: detail.stock_id, status: 'active' } },
            );
            const totalShares = subscriptions.reduce(
              (sum, sub) => sum + Number(sub.quantity),
              0,
            );
            if (totalShares > 0) {
              for (const sub of subscriptions) {
                const memberDividend =
                  (Number(sub.quantity) / totalShares) *
                  (detail.growth_from_interest * detail.total_shares);
                if (memberDividend > 0) {
                  const pendingDividend = queryRunner.manager.create(
                    PendingMemberPayment,
                    {
                      member_id: sub.member_id,
                      meeting_id: meetingId,
                      type: 'dividend',
                      amount: memberDividend,
                      status: 'pending',
                      notes: `Dividendo generado por acción ${stock.type}`,
                      stock_subscription_id: sub.id,
                    },
                  );
                  await queryRunner.manager.save(pendingDividend);
                }
              }
              // Asiento contable: pasivo por dividendos por pagar
              ledgerEntries.push(
                queryRunner.manager.create(LedgerEntry, {
                  operation_id: revaluationOperation.id,
                  account_type: 'DIVIDENDS_PAYABLE_ACCOUNT',
                  amount: detail.growth_from_interest * detail.total_shares,
                  description: `Dividendo generado por acción ${stock.type}`,
                  stock_id: detail.stock_id,
                }),
                queryRunner.manager.create(LedgerEntry, {
                  operation_id: revaluationOperation.id,
                  account_type: REVALUATION_SURPLUS_ACCOUNT,
                  amount: -detail.growth_from_interest * detail.total_shares,
                  description: `Contrapartida por dividendos en acción ${stock.type}`,
                  stock_id: detail.stock_id,
                }),
              );
            }
          }
        } else {
          // Por aportes de capital
          if (detail.growth_from_contributions > 0) {
            ledgerEntries.push(
              queryRunner.manager.create(LedgerEntry, {
                operation_id: revaluationOperation.id,
                account_type: INVESTMENT_IN_STOCKS_ACCOUNT,
                amount: detail.growth_from_contributions * detail.total_shares,
                description: `Aumento de valor por aportes de capital en acción ${detail.type}`,
                stock_id: detail.stock_id,
              }),
              queryRunner.manager.create(LedgerEntry, {
                operation_id: revaluationOperation.id,
                account_type: REVALUATION_SURPLUS_ACCOUNT,
                amount: -detail.growth_from_contributions * detail.total_shares,
                description: `Contrapartida por aportes de capital en acción ${detail.type}`,
                stock_id: detail.stock_id,
              }),
            );
          }
          // Por intereses
          if (detail.growth_from_interest > 0) {
            ledgerEntries.push(
              queryRunner.manager.create(LedgerEntry, {
                operation_id: revaluationOperation.id,
                account_type: INVESTMENT_IN_STOCKS_ACCOUNT,
                amount: detail.growth_from_interest * detail.total_shares,
                description: `Aumento de valor por intereses en acción ${detail.type}`,
                stock_id: detail.stock_id,
              }),
              queryRunner.manager.create(LedgerEntry, {
                operation_id: revaluationOperation.id,
                account_type: REVALUATION_SURPLUS_ACCOUNT,
                amount: -detail.growth_from_interest * detail.total_shares,
                description: `Contrapartida por intereses en acción ${detail.type}`,
                stock_id: detail.stock_id,
              }),
            );
          }
        }
      }
      // Asientos para aportes obligatorios (revalorización de aportes obligatorios)
      if (
        preview.mandatory_contributions_by_type &&
        preview.mandatory_contributions_by_type.length > 0
      ) {
        for (const m of preview.mandatory_contributions_by_type) {
          ledgerEntries.push(
            queryRunner.manager.create(LedgerEntry, {
              operation_id: revaluationOperation.id,
              account_type: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
              amount: m.total,
              mandatory_contribution_id: m.mandatory_contribution_id,
              description:
                'Revalorización de aportes obligatorios (no afecta acciones)',
            }),
            queryRunner.manager.create(LedgerEntry, {
              operation_id: revaluationOperation.id,
              account_type: REVALUATION_SURPLUS_ACCOUNT,
              amount: -m.total,
              mandatory_contribution_id: m.mandatory_contribution_id,
              description:
                'Contrapartida de revalorización de aportes obligatorios',
            }),
          );
        }
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
