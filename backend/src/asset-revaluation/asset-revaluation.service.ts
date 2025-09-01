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
  DIVIDENDS_PAYABLE_ACCOUNT,
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
import {
  RevaluationDetailDto,
  RevaluationPreviewResultDto,
} from './dto/revaluation-preview-result.dto';
import { PendingMemberPayment } from '../meetings/entities/pending-member-payment.entity';
import { StockBehavior } from '../stocks/entities/stock.entity';
import { OperationType } from '../common/enums/operation-type.enum';
import { roundAndLimit } from '../common/utils/round-and-limit.util';
import { GuaranteedGrowthHandler } from './strategies/guaranteed-growth.handler';
import { ProportionalGrowthHandler } from './strategies/proportional-growth.handler';
import { DistributionContext } from './strategies/distribution-chain';
import { runDistributionChain } from './strategies/distribution-orchestrator';
import { PendingPaymentType } from '../common/enums/pending-payment-type.enum';

@Injectable()
export class AssetRevaluationService {
  private readonly logger = new Logger(AssetRevaluationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  private async _validateRevaluationContext(
    meetingId: string,
    totalInterest: number,
    stocks: Stock[],
    subscriptions: StockSubscription[],
  ): Promise<void> {
    // Validar que la reunión existe
    const meeting = await this.meetingRepository.findOneBy({ id: meetingId });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found.`);
    }

    // Validar que hay acciones disponibles
    if (stocks.length === 0) {
      throw new BadRequestException('No stocks available for revaluation.');
    }

    // Validar que hay suscripciones activas
    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.status === 'active',
    );
    if (activeSubscriptions.length === 0) {
      throw new BadRequestException('No active stock subscriptions found.');
    }

    // Validar que los intereses no son negativos
    if (totalInterest < 0) {
      throw new BadRequestException('Total interest cannot be negative.');
    }

    // Validar acciones garantizadas
    const guaranteedStocks = stocks.filter((s) => s.is_guaranteed);
    for (const stock of guaranteedStocks) {
      if (!stock.guaranteed_yield || stock.guaranteed_yield <= 0) {
        throw new BadRequestException(
          `Guaranteed stock ${stock.type} must have a positive guaranteed yield.`,
        );
      }
    }

    this.logger.log(
      `Revaluation context validated for meeting ${meetingId}: ${stocks.length} stocks, ${activeSubscriptions.length} active subscriptions, ${totalInterest} total interest`,
    );
  }

  private async _calculateRevaluationData(
    meetingId: string,
  ): Promise<RevaluationPreviewResultDto> {
    const meeting = await this.meetingRepository.findOneBy({ id: meetingId });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found.`);
    }

    const ledgerEntries = await this.dataSource.manager.find(LedgerEntry, {
      where: { operation: { meeting_id: meetingId } },
      relations: ['operation', 'loan'],
    });

    // Calcular intereses total y específicamente de préstamos ágiles y prioritarios
    const totalInterest = ledgerEntries
      .filter((e) => [INTEREST_INCOME_ACCOUNT].includes(e.account_type))
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const agilePriorityInterest = ledgerEntries
      .filter(
        (e) =>
          [INTEREST_INCOME_ACCOUNT].includes(e.account_type) &&
          e.loan &&
          ['agil', 'prioritario'].includes(e.loan.loan_type),
      )
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const totalStockContributions = ledgerEntries
      .filter(
        (e) =>
          e.account_type === STOCK_CAPITAL_ACCOUNT &&
          e.operation?.type === OperationType.MONTHLY_PAYMENT,
      )
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const totalMandatoryContributions = ledgerEntries
      .filter((e) => e.account_type === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const stocks = await this.dataSource.manager.find(Stock);
    const subscriptions = await this.dataSource.manager.find(StockSubscription);

    // Validar contexto antes de proceder
    await this._validateRevaluationContext(
      meetingId,
      totalInterest,
      stocks,
      subscriptions,
    );

    // Paso 1: Construir el contexto para la cadena
    const interestAvailableForDistribution = totalInterest;
    const guaranteedStocks = stocks.filter((s) => s.is_guaranteed);
    let totalRequiredGuaranteedGrowth = 0;
    for (const stock of guaranteedStocks) {
      const totalShares = subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);
      if (totalShares === 0) continue;
      const requiredGrowthPerShare =
        Number(stock.value) * Number(stock.guaranteed_yield);
      totalRequiredGuaranteedGrowth += requiredGrowthPerShare * totalShares;
    }

    const context: DistributionContext = {
      totalInterest,
      totalStockContributions,
      interestAvailableForDistribution,
      totalRequiredGuaranteedGrowth,
      agilePriorityInterest,
      stocks,
      subscriptions,
      ledgerEntries,
    };

    // Paso 2: Ejecutar la cadena de distribución con el orden correcto
    // Orden de prioridad: 1. Garantizados, 2. Proporcionales (incluye dividendos)
    const handlers = [
      new GuaranteedGrowthHandler(),
      new ProportionalGrowthHandler(),
    ];

    this.logger.log(
      `Executing distribution chain for meeting ${meetingId} with ${totalInterest} total interest`,
    );

    const distributionResult = runDistributionChain(
      handlers,
      totalInterest,
      context,
    );

    const assignedInterest = distributionResult.assigned;

    this.logger.log(
      `Distribution completed. Assigned: ${Object.keys(assignedInterest).length} stocks, Remaining: ${distributionResult.remaining}`,
    );

    // Paso 3: Calcular detalles por stock
    // Calcular crecimiento por aportes exacto por acción
    // SOLO incluir aportes mensuales (MONTHLY_PAYMENT), NO compras de acciones ni ajustes extraordinarios
    const contributionsByStock: Record<string, number> = {};
    ledgerEntries
      .filter(
        (e) =>
          e.account_type === STOCK_CAPITAL_ACCOUNT &&
          e.stock_id &&
          e.operation?.type === OperationType.MONTHLY_PAYMENT,
      )
      .forEach((e) => {
        const stockId = e.stock_id as string;
        if (!contributionsByStock[stockId]) contributionsByStock[stockId] = 0;
        contributionsByStock[stockId] += Math.abs(Number(e.amount));
      });

    // Proporción de intereses para la cadena
    const details: RevaluationDetailDto[] = stocks.map((stock) => {
      const totalShares = subscriptions
        .filter((sub) => sub.stock_id === stock.id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);

      // Crecimiento por aportes: total aportado a la acción dividido entre acciones
      const growthFromContributions =
        totalShares > 0
          ? (contributionsByStock[stock.id] || 0) / totalShares
          : 0;

      // Si es DIVIDEND_YIELD, el asignado va a dividends_generated, no a growth_from_interest
      const isDividendYield = stock.behavior === StockBehavior.DIVIDEND_YIELD;
      const assigned = assignedInterest[stock.id] || 0;
      const growthFromInterest = isDividendYield
        ? 0
        : totalShares > 0
          ? assigned / totalShares
          : 0;
      const dividendsGenerated = isDividendYield ? assigned / totalShares : 0;

      return {
        stock_id: stock.id,
        type: stock.type,
        is_guaranteed: stock.is_guaranteed,
        total_shares: totalShares,
        previous_value: Number(stock.value),
        growth_from_contributions: growthFromContributions,
        growth_from_interest: growthFromInterest,
        total_growth_per_share: growthFromInterest + growthFromContributions,
        estimated_growth_from_contributions: stock.monthly_contribution,
        new_value:
          Number(stock.value) + growthFromInterest + growthFromContributions,
        dividends_generated: dividendsGenerated,
      };
    });

    // Paso 4: Agrupar aportes obligatorios por tipo
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
  ): Promise<RevaluationPreviewResultDto> {
    // Obtener el historial de revaluación ejecutada
    const stockHistories = await this.dataSource.manager.find(
      StockValueHistory,
      {
        where: { operation_id: operationId },
        relations: ['stock'],
      },
    );
    // Reconstruir los detalles de la revaluación ejecutada
    const details: RevaluationDetailDto[] = [];
    const stocks = await this.dataSource.manager.find(Stock);
    const subscriptions = await this.dataSource.manager.find(StockSubscription);

    for (const history of stockHistories) {
      const stock = stocks.find((s) => s.id === history.stock_id);
      const totalShares = subscriptions
        .filter((sub) => sub.stock_id === history.stock_id)
        .reduce((sum, sub) => sum + Number(sub.quantity), 0);

      const dividendsGenerated =
        (await this.dataSource.manager
          .find(LedgerEntry, {
            select: {
              amount: true,
            },
            where: {
              operation_id: operationId,
              account_type: DIVIDENDS_PAYABLE_ACCOUNT,
              stock_id: history.stock_id,
            },
          })
          .then((entries) =>
            entries.reduce((sum, e) => sum + Number(e.amount), 0),
          )) / totalShares;
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
          dividends_generated: dividendsGenerated,
        });
      }
    }

    // Get all edgers for the meeting
    const meetingLedgerEntries = await this.dataSource.manager.find(
      LedgerEntry,
      {
        where: { operation: { meeting_id: meetingId } },
        relations: ['operation', 'loan'],
      },
    );

    // Calcular totales desde los asientos contables
    const totalContributions = meetingLedgerEntries
      .filter(
        (e) =>
          e.account_type === STOCK_CAPITAL_ACCOUNT &&
          e.operation?.type === OperationType.MONTHLY_PAYMENT,
      )
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    const totalInterest = meetingLedgerEntries
      .filter((e) => [INTEREST_INCOME_ACCOUNT].includes(e.account_type))
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
  ): Promise<RevaluationPreviewResultDto> {
    // Verificar si ya existe una revaluación ejecutada para esta reunión
    const existingRevaluation = await this.dataSource.manager.findOne(
      Operation,
      {
        where: {
          meeting_id: meetingId,
          type: OperationType.ASSET_REVALUATION,
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
          type: OperationType.ASSET_REVALUATION,
        },
      },
    );

    return !!existingRevaluation;
  }

  async executeRevaluation(
    meetingId: string,
  ): Promise<RevaluationPreviewResultDto> {
    // Verificar si ya existe una revaluación para esta reunión
    const existingRevaluation = await this.dataSource.manager.findOne(
      Operation,
      {
        where: {
          meeting_id: meetingId,
          type: OperationType.ASSET_REVALUATION,
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
        type: OperationType.ASSET_REVALUATION,
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

        // Validación y redondeo para evitar overflow en la base de datos
        const previous_value = roundAndLimit(
          detail.previous_value,
          9999999999.99,
          2,
        );
        const growth_from_contributions = roundAndLimit(
          detail.growth_from_contributions,
          999999.9999,
          4,
        );
        const growth_from_interest = roundAndLimit(
          detail.growth_from_interest,
          999999.9999,
          4,
        );
        const total_growth_per_share = roundAndLimit(
          detail.total_growth_per_share,
          999999.9999,
          4,
        );
        const new_value = roundAndLimit(newValue, 9999999999.99, 2);

        const historyEntry = queryRunner.manager.create(StockValueHistory, {
          stock_id: detail.stock_id,
          operation_id: revaluationOperation.id,
          previous_value,
          growth_from_contributions,
          growth_from_interest,
          total_growth_per_share,
          new_value,
        });
        await queryRunner.manager.save(historyEntry);
        await queryRunner.manager.update(Stock, detail.stock_id, {
          value: new_value,
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
          if (detail.dividends_generated && detail.dividends_generated > 0) {
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
                  (detail.dividends_generated * detail.total_shares);
                if (memberDividend > 0) {
                  const pendingDividend = queryRunner.manager.create(
                    PendingMemberPayment,
                    {
                      member_id: sub.member_id,
                      meeting_id: meetingId,
                      type: PendingPaymentType.DIVIDEND,
                      amount: memberDividend,
                      status: 'pending',
                      notes: `Dividendo generado por acción ${stock.type}`,
                      stock_id: detail.stock_id,
                      stock_subscription_id: sub.id,
                      reference_meeting_id: meetingId,
                      disbursement_type: 'dividend',
                    },
                  );
                  await queryRunner.manager.save(pendingDividend);
                }
              }
              // Asiento contable: pasivo por dividendos por pagar
              ledgerEntries.push(
                queryRunner.manager.create(LedgerEntry, {
                  operation_id: revaluationOperation.id,
                  account_type: DIVIDENDS_PAYABLE_ACCOUNT,
                  amount: detail.dividends_generated * detail.total_shares,
                  description: `Dividendo generado por acción ${stock.type}`,
                  stock_id: detail.stock_id,
                }),
                queryRunner.manager.create(LedgerEntry, {
                  operation_id: revaluationOperation.id,
                  account_type: REVALUATION_SURPLUS_ACCOUNT,
                  amount: -detail.dividends_generated * detail.total_shares,
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
