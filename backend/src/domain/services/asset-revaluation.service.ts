import { MeetingRepository } from '../ports/repositories/meeting-repository.port';
import { LedgerEntryRepository } from '../ports/repositories/ledger-entry-repository.port';
import { StockRepository } from '../ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '../ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '../ports/repositories/loan-repository.port';
import { OperationRepository } from '../ports/repositories/operation-repository.port';
import { StockValueHistoryRepository } from '../ports/repositories/stock-value-history-repository.port';
import { InterestDistributionConfigRepository } from '../ports/repositories/interest-distribution-config-repository.port';
import { Stock } from '../entities/stock.entity';
import { StockSubscription } from '../entities/stock-subscription.entity';
import { OperationType } from '../enums/operation-type.enum';
import {
  INTEREST_INCOME_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  DIVIDENDS_PAYABLE_ACCOUNT,
} from '../constants/account-types';
import { StockBehavior } from '../entities/stock.entity';
import { DistributionContext } from './revaluation/distribution-chain';
import { GuaranteedGrowthHandler } from './revaluation/guaranteed-growth.handler';
import { ProportionalGrowthHandler } from './revaluation/proportional-growth.handler';
import { runDistributionChain } from './revaluation/distribution-orchestrator';
import { InvalidRequestError } from '../errors/invalid-request.error';
import { NotFoundError } from '../errors/not-found.error';

export interface RevaluationCalculationResult {
  totalContributions: number;
  totalInterest: number;
  totalToDistribute: number;
  details: Array<{
    stockId: string;
    type: string;
    isGuaranteed: boolean;
    totalShares: number;
    previousValue: number;
    growthFromContributions: number;
    growthFromInterest: number;
    totalGrowthPerShare: number;
    estimatedGrowthFromContributions: number;
    newValue: number;
    dividendsGenerated?: number;
  }>;
  totalMandatoryContributions: number;
  mandatoryContributionsByType: Array<{
    mandatoryContributionId: string;
    total: number;
  }>;
}

export class AssetRevaluationDomainService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly loanRepository: LoanRepository,
    private readonly operationRepository: OperationRepository,
    private readonly stockValueHistoryRepository: StockValueHistoryRepository,
    private readonly distributionConfigRepository: InterestDistributionConfigRepository,
  ) {}

  async calculateRevaluationData(
    meetingId: string,
  ): Promise<RevaluationCalculationResult> {
    // Validar que el meeting existe
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new NotFoundError(
        `Meeting with ID ${meetingId} not found`,
        meetingId,
      );
    }

    // Obtener ledger entries del meeting
    const ledgerEntries =
      await this.ledgerEntryRepository.findByMeeting(meetingId);

    // Obtener operaciones del meeting para filtrar por tipo
    const operations = await this.operationRepository.findByMeeting(meetingId);
    const operationMap = new Map(operations.map((op) => [op.id, op]));

    // Calcular intereses total y específicamente de préstamos ágiles y prioritarios
    const interestEntries = ledgerEntries.filter(
      (e) => e.accountType === INTEREST_INCOME_ACCOUNT,
    );
    const totalInterest = interestEntries.reduce(
      (sum, e) => sum + Math.abs(e.amount),
      0,
    );

    // Obtener loans para calcular interés de préstamos ágiles y prioritarios
    const loanIds = Array.from(
      new Set(
        interestEntries
          .map((e) => e.loanId)
          .filter((id): id is string => id !== null && id !== undefined),
      ),
    );
    const loans =
      loanIds.length > 0 ? await this.loanRepository.findByIds(loanIds) : [];
    const loanMap = new Map(loans.map((loan) => [loan.id, loan]));

    // Fetch all distribution configs
    const distributionConfigs =
      await this.distributionConfigRepository.findAll();

    // Obtener stocks
    const stocks = await this.stockRepository.findAll();

    // Group interest by Stock ID based on configs
    const interestByStock: Record<string, number> = {};
    interestEntries.forEach((e) => {
      if (!e.loanId) return;
      const loan = loanMap.get(e.loanId);
      if (!loan || !loan.loanTypeId) return;

      // Find configs for this loan type
      const configs = distributionConfigs.filter(
        (c) => c.loanTypeId === loan.loanTypeId,
      );

      // Distribute this interest entry among configured stocks
      configs.forEach((config) => {
        const targetStocks = stocks.filter(
          (s) => s.stockTypeId === config.stockTypeId,
        );
        targetStocks.forEach((s) => {
          if (!interestByStock[s.id]) interestByStock[s.id] = 0;
          interestByStock[s.id] += Math.abs(e.amount) / targetStocks.length;
        });
      });
    });

    // Calcular aportes de capital (solo MONTHLY_PAYMENT)
    const totalStockContributions = ledgerEntries
      .filter((e) => {
        const operation = operationMap.get(e.operationId);
        return (
          e.accountType === STOCK_CAPITAL_ACCOUNT &&
          operation?.type === OperationType.MONTHLY_PAYMENT
        );
      })
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const totalMandatoryContributions = ledgerEntries
      .filter((e) => e.accountType === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    // Obtener subscriptions
    const allSubscriptions = await Promise.all(
      stocks.map((stock) =>
        this.stockSubscriptionRepository.findByStock(stock.id),
      ),
    );
    const subscriptions = allSubscriptions.flat();

    // Validar contexto
    this.validateRevaluationContext(
      meetingId,
      totalInterest,
      stocks,
      subscriptions,
    );

    // Construir contexto para la cadena de distribución
    const guaranteedStocks = stocks.filter((s) => s.isGuaranteed);
    let totalRequiredGuaranteedGrowth = 0;
    for (const stock of guaranteedStocks) {
      const totalShares = subscriptions
        .filter((sub) => sub.stockId === stock.id && sub.isActive())
        .reduce((sum, sub) => sum + sub.quantity, 0);
      if (totalShares === 0) continue;
      const requiredGrowthPerShare = stock.value * (stock.guaranteedYield || 0);
      totalRequiredGuaranteedGrowth += requiredGrowthPerShare * totalShares;
    }

    const context: DistributionContext = {
      totalInterest,
      totalStockContributions,
      interestAvailableForDistribution: totalInterest,
      totalRequiredGuaranteedGrowth,
      interestByStock,
      stocks,
      subscriptions,
      ledgerEntries,
    };

    // Ejecutar cadena de distribución
    const handlers = [
      new GuaranteedGrowthHandler(),
      new ProportionalGrowthHandler(),
    ];

    const distributionResult = runDistributionChain(
      handlers,
      totalInterest,
      context,
    );

    const assignedInterest = distributionResult.assigned;

    // Calcular crecimiento por aportes por stock
    const contributionsByStock: Record<string, number> = {};
    ledgerEntries
      .filter((e) => {
        const operation = operationMap.get(e.operationId);
        return (
          e.accountType === STOCK_CAPITAL_ACCOUNT &&
          e.stockId &&
          operation?.type === OperationType.MONTHLY_PAYMENT
        );
      })
      .forEach((e) => {
        const stockId = e.stockId!;
        if (!contributionsByStock[stockId]) {
          contributionsByStock[stockId] = 0;
        }
        contributionsByStock[stockId] += Math.abs(e.amount);
      });

    // Calcular detalles por stock
    const details = stocks.map((stock) => {
      const totalShares = subscriptions
        .filter((sub) => sub.stockId === stock.id && sub.isActive())
        .reduce((sum, sub) => sum + sub.quantity, 0);

      const growthFromContributions =
        totalShares > 0
          ? (contributionsByStock[stock.id] || 0) / totalShares
          : 0;

      const isDividendYield = stock.behavior === StockBehavior.DIVIDEND_YIELD;
      const assigned = assignedInterest[stock.id] || 0;
      const growthFromInterest = isDividendYield
        ? 0
        : totalShares > 0
          ? assigned / totalShares
          : 0;
      const dividendsGenerated = isDividendYield
        ? totalShares > 0
          ? assigned / totalShares
          : 0
        : undefined;

      return {
        stockId: stock.id,
        type: stock.type,
        isGuaranteed: stock.isGuaranteed,
        totalShares,
        previousValue: stock.value,
        growthFromContributions,
        growthFromInterest,
        totalGrowthPerShare: growthFromInterest + growthFromContributions,
        estimatedGrowthFromContributions: stock.monthlyContribution,
        newValue: stock.value + growthFromInterest + growthFromContributions,
        dividendsGenerated,
      };
    });

    // Agrupar aportes obligatorios por tipo
    const mandatoryContributionMap: Record<
      string,
      { total: number; mandatoryContributionId: string }
    > = {};
    ledgerEntries
      .filter(
        (e) =>
          e.accountType === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT &&
          e.mandatoryContributionId,
      )
      .forEach((e) => {
        const id = e.mandatoryContributionId!;
        if (!mandatoryContributionMap[id]) {
          mandatoryContributionMap[id] = {
            total: 0,
            mandatoryContributionId: id,
          };
        }
        mandatoryContributionMap[id].total += Math.abs(e.amount);
      });
    const mandatoryContributionsByType = Object.values(
      mandatoryContributionMap,
    );

    return {
      totalContributions: totalStockContributions,
      totalInterest,
      totalToDistribute: totalStockContributions + totalInterest,
      details: details.sort((a, b) => a.type.localeCompare(b.type)),
      totalMandatoryContributions,
      mandatoryContributionsByType,
    };
  }

  validateRevaluationContext(
    meetingId: string,
    totalInterest: number,
    stocks: Stock[],
    subscriptions: StockSubscription[],
  ): void {
    // Validar que hay acciones disponibles
    if (stocks.length === 0) {
      throw new InvalidRequestError('No stocks available for revaluation.');
    }

    // Validar que hay suscripciones activas
    const activeSubscriptions = subscriptions.filter((sub) => sub.isActive());
    if (activeSubscriptions.length === 0) {
      throw new InvalidRequestError('No active stock subscriptions found.');
    }

    // Validar que los intereses no son negativos
    if (totalInterest < 0) {
      throw new InvalidRequestError('Total interest cannot be negative.');
    }

    // Validar acciones garantizadas
    const guaranteedStocks = stocks.filter((s) => s.isGuaranteed);
    for (const stock of guaranteedStocks) {
      if (!stock.guaranteedYield || stock.guaranteedYield <= 0) {
        throw new InvalidRequestError(
          `Guaranteed stock ${stock.type} must have a positive guaranteed yield.`,
        );
      }
    }
  }

  async getExecutedRevaluationData(
    operationId: string,
    meetingId: string,
  ): Promise<RevaluationCalculationResult> {
    // Obtener el historial de revaluación ejecutada
    const stockHistories =
      await this.stockValueHistoryRepository.findByOperation(operationId);

    // Obtener stocks y subscriptions
    const stocks = await this.stockRepository.findAll();
    const allSubscriptions = await Promise.all(
      stocks.map((stock) =>
        this.stockSubscriptionRepository.findByStock(stock.id),
      ),
    );
    const subscriptions = allSubscriptions.flat();

    // Obtener ledger entries del meeting
    const ledgerEntries =
      await this.ledgerEntryRepository.findByMeeting(meetingId);

    // Obtener operaciones del meeting
    const operations = await this.operationRepository.findByMeeting(meetingId);
    const operationMap = new Map(operations.map((op) => [op.id, op]));

    // Reconstruir los detalles de la revaluación ejecutada
    const details: Array<{
      stockId: string;
      type: string;
      isGuaranteed: boolean;
      totalShares: number;
      previousValue: number;
      growthFromContributions: number;
      growthFromInterest: number;
      totalGrowthPerShare: number;
      estimatedGrowthFromContributions: number;
      newValue: number;
      dividendsGenerated?: number;
    }> = [];

    for (const history of stockHistories) {
      const stock = stocks.find((s) => s.id === history.stockId);
      if (!stock) continue;

      const totalShares = subscriptions
        .filter((sub) => sub.stockId === history.stockId && sub.isActive())
        .reduce((sum, sub) => sum + sub.quantity, 0);

      // Obtener dividendos generados desde ledger entries
      const dividendEntries = ledgerEntries.filter(
        (e) =>
          e.operationId === operationId &&
          e.accountType === DIVIDENDS_PAYABLE_ACCOUNT &&
          e.stockId === history.stockId,
      );
      const totalDividends = dividendEntries.reduce(
        (sum, e) => sum + Math.abs(e.amount),
        0,
      );
      const dividendsGenerated =
        totalShares > 0 ? totalDividends / totalShares : 0;

      details.push({
        stockId: history.stockId,
        type: stock.type,
        isGuaranteed: stock.isGuaranteed,
        totalShares,
        previousValue: history.previousValue,
        growthFromContributions: history.growthFromContributions,
        growthFromInterest: history.growthFromInterest,
        totalGrowthPerShare: history.totalGrowthPerShare,
        estimatedGrowthFromContributions: stock.monthlyContribution,
        newValue: history.newValue,
        dividendsGenerated:
          dividendsGenerated > 0 ? dividendsGenerated : undefined,
      });
    }

    // Calcular totales desde los asientos contables
    const totalContributions = ledgerEntries
      .filter((e) => {
        const operation = operationMap.get(e.operationId);
        return (
          e.accountType === STOCK_CAPITAL_ACCOUNT &&
          operation?.type === OperationType.MONTHLY_PAYMENT
        );
      })
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const totalInterest = ledgerEntries
      .filter((e) => e.accountType === INTEREST_INCOME_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const totalMandatoryContributions = ledgerEntries
      .filter((e) => e.accountType === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    // Agrupar aportes obligatorios por tipo
    const mandatoryContributionMap: Record<
      string,
      { total: number; mandatoryContributionId: string }
    > = {};
    ledgerEntries
      .filter(
        (e) =>
          e.accountType === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT &&
          e.mandatoryContributionId,
      )
      .forEach((e) => {
        const id = e.mandatoryContributionId!;
        if (!mandatoryContributionMap[id]) {
          mandatoryContributionMap[id] = {
            total: 0,
            mandatoryContributionId: id,
          };
        }
        mandatoryContributionMap[id].total += Math.abs(e.amount);
      });

    return {
      totalContributions,
      totalInterest,
      totalToDistribute: totalContributions + totalInterest,
      details: details.sort((a, b) => a.type.localeCompare(b.type)),
      totalMandatoryContributions,
      mandatoryContributionsByType: Object.values(mandatoryContributionMap),
    };
  }
}
