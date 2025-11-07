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

    const financingLoanIds = Array.from(
      new Set(
        subscriptions
          .map((subscription) => subscription.financingLoanId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const financingLoans = financingLoanIds.length
      ? await this.loanRepository.findByIds(financingLoanIds)
      : [];

    const activeFinancingLoanIds = new Set(
      financingLoans
        .filter((loan) => loan.status === 'active')
        .map((loan) => loan.id),
    );

    const totalDebt = loans
      .filter((loan) => !activeFinancingLoanIds.has(loan.id))
      .reduce((sum, loan) => sum + loan.outstandingBalance, 0);

    const stockIds = Array.from(
      new Set(subscriptions.map((subscription) => subscription.stockId)),
    );
    const stockValueMap = new Map<string, number>();

    for (const stockId of stockIds) {
      if (!stockValueMap.has(stockId)) {
        const stock = await this.stockRepository.findById(stockId);
        stockValueMap.set(stockId, stock ? stock.value : 0);
      }
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
