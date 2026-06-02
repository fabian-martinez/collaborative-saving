import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';

export interface CalculateMemberInsuranceUseCaseInput {
  memberId: string;
  capitalPayment?: number;
}
export interface CalculateMemberInsuranceUseCaseOutput {
  insuranceAmount: number;
}

export class CalculateMemberInsuranceUseCase {
  constructor(
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly loanRepository: LoanRepository,
    private readonly stockRepository: StockRepository,
  ) {}

  async execute({
    memberId,
    capitalPayment = 0,
  }: CalculateMemberInsuranceUseCaseInput): Promise<CalculateMemberInsuranceUseCaseOutput> {
    const subscriptions =
      await this.stockSubscriptionRepository.findByMember(memberId);

    const loans = await this.loanRepository.findActiveByMember(memberId);

    const financingLoanIds = new Set(
      subscriptions
        .map((subscription) => subscription.financingLoanId)
        .filter((id): id is string => Boolean(id)),
    );

    const activeFinancingLoanIds = new Set(
      loans
        .filter((loan) => financingLoanIds.has(loan.id))
        .map((loan) => loan.id),
    );

    const totalDebt = loans
      .filter((loan) => !activeFinancingLoanIds.has(loan.id))
      .reduce((sum, loan) => sum + loan.outstandingBalance, 0);

    const stockIds = Array.from(
      new Set(subscriptions.map((subscription) => subscription.stockId)),
    );
    const stockValueMap = new Map<string, number>();

    if (stockIds.length > 0) {
      // ⚡ Bolt: Prevent N+1 queries by fetching all needed stocks in a single query
      // Using findByIds combined with a Set/Map preserves functionality for missing stocks
      const stocks = await this.stockRepository.findByIds(stockIds);
      const stockMap = new Map(stocks.map((stock) => [stock.id, stock]));

      stockIds.forEach((stockId) => {
        const stock = stockMap.get(stockId);
        stockValueMap.set(stockId, stock ? stock.value : 0);
      });
    }

    const totalSavings = subscriptions.reduce((sum, subscription) => {
      const financingLoanId = subscription.financingLoanId;
      const hasActiveFinancingLoan =
        financingLoanId !== undefined &&
        financingLoanId !== null &&
        activeFinancingLoanIds.has(financingLoanId);

      if (hasActiveFinancingLoan) {
        return sum;
      }

      const stockValue = stockValueMap.get(subscription.stockId) ?? 0;
      return sum + subscription.quantity * stockValue;
    }, 0);

    const adjustedDebt = totalDebt - capitalPayment;
    const insuranceBase = adjustedDebt - totalSavings;
    const insuranceAmount = insuranceBase > 0 ? insuranceBase * 0.001 : 0;

    return {
      insuranceAmount,
    };
  }
}
