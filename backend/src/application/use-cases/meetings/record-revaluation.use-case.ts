import { RecordRevaluationDto } from '@application/dto/meetings/record-revaluation.dto';
import { RevaluationResultDto } from '@application/dto/meetings/revaluation-result.dto';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { AssetRevaluationDomainService } from '@domain/services/asset-revaluation.service';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Operation } from '@domain/entities/operation.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { StockValueHistory } from '@domain/entities/stock-value-history.entity';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPaymentType } from '@domain/entities/pending-member-payment.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import {
  INVESTMENT_IN_STOCKS_ACCOUNT,
  REVALUATION_SURPLUS_ACCOUNT,
  DIVIDENDS_PAYABLE_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  AccountType,
} from '@domain/constants/account-types';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { OperationBalanceValidator } from '@domain/services/operation-balance-validator.service';
import { roundAndLimit } from '@domain/utils/round-and-limit.util';

export class RecordRevaluationUseCase {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly stockValueHistoryRepository: StockValueHistoryRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly transactionManager: TransactionManager,
    private readonly assetRevaluationDomainService: AssetRevaluationDomainService,
    private readonly balanceValidator: OperationBalanceValidator,
  ) {}

  async execute(dto: RecordRevaluationDto): Promise<RevaluationResultDto> {
    return this.transactionManager.execute(async () => {
      // Validar que el meeting existe
      const meeting = await this.meetingRepository.findById(dto.meetingId);
      if (!meeting) {
        throw new MeetingNotFoundException(dto.meetingId);
      }

      // Verificar si ya existe una revaluación ejecutada (idempotente)
      const existingRevaluation =
        await this.operationRepository.findByMeetingAndType(
          dto.meetingId,
          OperationType.ASSET_REVALUATION,
        );

      if (existingRevaluation.length > 0) {
        const operation = existingRevaluation[0];
        const existingEntries =
          await this.ledgerEntryRepository.findByOperation(operation.id);

        if (existingEntries.length === 0) {
          throw new BusinessRuleError(
            `Inconsistent revaluation state detected for meeting ${dto.meetingId}: operation ${operation.id} exists but has no ledger entries`,
          );
        }

        // Si ya existe y es válida, retornar resultado existente
        const calculationResult =
          await this.assetRevaluationDomainService.getExecutedRevaluationData(
            operation.id,
            dto.meetingId,
          );

        return {
          ...calculationResult,
          status: 'executed',
          executedAt: operation.date.toISOString(),
          operationId: operation.id,
        };
      }

      // Calcular datos de revaluación
      const calculationResult =
        await this.assetRevaluationDomainService.calculateRevaluationData(
          dto.meetingId,
        );

      const { details } = calculationResult;

      // 1. Crear la operación de revaluación
      const operation = Operation.create({
        meetingId: dto.meetingId,
        type: OperationType.ASSET_REVALUATION,
        date: meeting.date,
        description: `Revaluación de activos para la reunión del ${meeting.date.toLocaleDateString()}`,
      });

      const operationId = operation.id;

      // Guardar la operación primero para evitar error de foreign key en historiales y asientos
      await this.operationRepository.save(operation);

      // 2. Crear historiales y actualizar valores de acciones
      const stockHistories: StockValueHistory[] = [];
      const stockUpdates: Array<{ stockId: string; newValue: number }> = [];

      // ⚡ Bolt: Cache stocks for O(1) lookups instead of N+1 database queries
      const uniqueStockIds = Array.from(new Set(details.map((d) => d.stockId)));
      const stocks = await this.stockRepository.findByIds(uniqueStockIds);
      const stockMap = new Map(stocks.map((s) => [s.id, s]));

      for (const detail of details) {
        const stock = stockMap.get(detail.stockId);
        if (!stock) {
          throw new InvalidRequestError(
            `Stock with ID ${detail.stockId} not found`,
          );
        }

        // Si es DIVIDEND_YIELD, no aumentar el valor, solo registrar historia
        const isDividendYield = stock.behavior === StockBehavior.DIVIDEND_YIELD;
        const newValue = isDividendYield
          ? detail.previousValue
          : detail.newValue;

        // Validación y redondeo
        const previousValue = roundAndLimit(
          detail.previousValue,
          9999999999.99,
          2,
        );
        const growthFromContributions = roundAndLimit(
          detail.growthFromContributions,
          999999.9999,
          4,
        );
        const growthFromInterest = roundAndLimit(
          detail.growthFromInterest,
          999999.9999,
          4,
        );
        const totalGrowthPerShare = roundAndLimit(
          detail.totalGrowthPerShare,
          999999.9999,
          4,
        );
        const roundedNewValue = roundAndLimit(newValue, 9999999999.99, 2);

        const history = StockValueHistory.create({
          stockId: detail.stockId,
          operationId,
          previousValue,
          growthFromContributions,
          growthFromInterest,
          totalGrowthPerShare,
          newValue: roundedNewValue,
        });

        stockHistories.push(history);
        stockUpdates.push({
          stockId: detail.stockId,
          newValue: roundedNewValue,
        });
      }

      // Guardar historiales
      await this.stockValueHistoryRepository.saveMany(stockHistories);

      // Actualizar valores de acciones
      const stocksToUpdate: Stock[] = [];
      for (const update of stockUpdates) {
        const stock = stockMap.get(update.stockId);
        if (stock) {
          stock.update({ value: update.newValue });
          stocksToUpdate.push(stock);
        }
      }

      // Bolt ⚡: Guardar todas las acciones actualizadas en batch
      if (stocksToUpdate.length > 0) {
        await this.stockRepository.saveMany(stocksToUpdate);
      }

      // 3. Crear asientos contables y pagos pendientes de dividendos
      const ledgerEntries: Array<{
        accountType: AccountType;
        amount: number;
        description: string;
        stockId?: string | null;
        mandatoryContributionId?: string | null;
      }> = [];
      const pendingPayments: PendingMemberPayment[] = [];

      // ⚡ Bolt: Fetch all relevant subscriptions for dividend processing in a single query
      // instead of performing an N+1 query inside the loop.
      const dividendYieldStockIds = Array.from(
        new Set(
          details
            .filter((d) => d.dividendsGenerated && d.dividendsGenerated > 0)
            .map((d) => d.stockId),
        ),
      );

      const allDividendSubscriptions =
        await this.stockSubscriptionRepository.findByStocks(
          dividendYieldStockIds,
        );
      const dividendSubscriptionsMap = new Map<string, StockSubscription[]>();

      for (const sub of allDividendSubscriptions) {
        const subs = dividendSubscriptionsMap.get(sub.stockId) || [];
        subs.push(sub);
        dividendSubscriptionsMap.set(sub.stockId, subs);
      }

      for (const detail of details) {
        const stock = stockMap.get(detail.stockId);
        if (!stock) continue;

        const isDividendYield = stock.behavior === StockBehavior.DIVIDEND_YIELD;

        if (isDividendYield) {
          // Generar dividendos
          if (detail.dividendsGenerated && detail.dividendsGenerated > 0) {
            const subscriptions =
              dividendSubscriptionsMap.get(detail.stockId) || [];
            const activeSubscriptions = subscriptions.filter((sub) =>
              sub.isActive(),
            );
            const totalShares = activeSubscriptions.reduce(
              (sum, sub) => sum + sub.quantity,
              0,
            );

            if (totalShares <= 0) {
              throw new BusinessRuleError(
                `No active subscriptions found for dividend yield stock ${stock.type} with generated dividends`,
              );
            }

            // Crear pagos pendientes de dividendos
            for (const sub of activeSubscriptions) {
              const memberDividend = roundAndLimit(
                (sub.quantity / totalShares) *
                  (detail.dividendsGenerated * detail.totalShares),
                9999999999.99,
                2,
              );
              if (memberDividend > 0) {
                const pendingPayment = PendingMemberPayment.create({
                  memberId: sub.memberId,
                  meetingId: dto.meetingId,
                  type: PendingMemberPaymentType.DIVIDEND,
                  amount: memberDividend,
                  notes: `Dividendo generado por acción ${stock.type}`,
                  stockId: detail.stockId,
                  stockSubscriptionId: sub.id,
                  referenceMeetingId: dto.meetingId,
                  disbursementType: 'dividend',
                });
                pendingPayments.push(pendingPayment);
              }
            }

            // Asientos contables para dividendos
            const totalDividends = roundAndLimit(
              detail.dividendsGenerated * detail.totalShares,
              9999999999.99,
              2,
            );
            ledgerEntries.push(
              {
                accountType: DIVIDENDS_PAYABLE_ACCOUNT,
                amount: totalDividends,
                description: `Dividendo generado por acción ${stock.type}`,
                stockId: detail.stockId,
              },
              {
                accountType: REVALUATION_SURPLUS_ACCOUNT,
                amount: -totalDividends,
                description: `Contrapartida por dividendos en acción ${stock.type}`,
                stockId: detail.stockId,
              },
            );
          }
        } else {
          // Por aportes de capital
          if (detail.growthFromContributions > 0) {
            const totalGrowth = roundAndLimit(
              detail.growthFromContributions * detail.totalShares,
              9999999999.99,
              2,
            );
            ledgerEntries.push(
              {
                accountType: INVESTMENT_IN_STOCKS_ACCOUNT,
                amount: totalGrowth,
                description: `Aumento de valor por aportes de capital en acción ${detail.type}`,
                stockId: detail.stockId,
              },
              {
                accountType: REVALUATION_SURPLUS_ACCOUNT,
                amount: -totalGrowth,
                description: `Contrapartida por aportes de capital en acción ${detail.type}`,
                stockId: detail.stockId,
              },
            );
          }

          // Por intereses
          if (detail.growthFromInterest > 0) {
            const totalGrowth = roundAndLimit(
              detail.growthFromInterest * detail.totalShares,
              9999999999.99,
              2,
            );
            ledgerEntries.push(
              {
                accountType: INVESTMENT_IN_STOCKS_ACCOUNT,
                amount: totalGrowth,
                description: `Aumento de valor por intereses en acción ${detail.type}`,
                stockId: detail.stockId,
              },
              {
                accountType: REVALUATION_SURPLUS_ACCOUNT,
                amount: -totalGrowth,
                description: `Contrapartida por intereses en acción ${detail.type}`,
                stockId: detail.stockId,
              },
            );
          }
        }
      }

      // Asientos para aportes obligatorios
      if (calculationResult.mandatoryContributionsByType.length > 0) {
        for (const m of calculationResult.mandatoryContributionsByType) {
          const totalMandatory = roundAndLimit(m.total, 9999999999.99, 2);
          ledgerEntries.push(
            {
              accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
              amount: totalMandatory,
              description:
                'Revalorización de aportes obligatorios (no afecta acciones)',
              mandatoryContributionId: m.mandatoryContributionId,
            },
            {
              accountType: REVALUATION_SURPLUS_ACCOUNT,
              amount: -totalMandatory,
              description:
                'Contrapartida de revalorización de aportes obligatorios',
              mandatoryContributionId: m.mandatoryContributionId,
            },
          );
        }
      }

      // 4. Crear asientos contables
      const ledgerEntryEntities = ledgerEntries.map((entry) =>
        LedgerEntry.create({
          operationId,
          accountType: entry.accountType,
          amount: entry.amount,
          description: entry.description,
          stockId: entry.stockId ?? null,
          mandatoryContributionId: entry.mandatoryContributionId ?? null,
        }),
      );

      // Validar balance y asociar asientos con la operación
      operation.setEntries(ledgerEntryEntities);

      // Guardar asientos contables
      await this.ledgerEntryRepository.saveMany(ledgerEntryEntities);

      // Guardar pagos pendientes
      if (pendingPayments.length > 0) {
        await this.pendingMemberPaymentRepository.saveMany(pendingPayments);
      }

      // Retornar resultado
      return {
        ...calculationResult,
        status: 'executed',
        executedAt: meeting.date.toISOString(),
        operationId,
      };
    });
  }
}
