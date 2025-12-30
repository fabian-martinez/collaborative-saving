import { Injectable } from '@nestjs/common';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { MandatoryContributionStrategy } from './mandatory-contribution.strategy';
import { StockFeeStrategy } from './stock-fee.strategy';
import { LoanPaymentStrategy } from './loan-payment.strategy';
import { FeeStrategy } from './fee.strategy';
import { InsuranceStrategy } from './insurance.strategy';
import { DefaultPaymentStrategy } from './default-payment.strategy';
import { NoveltyPaymentStrategy } from './novelty-payment.strategy';
import { PaymentType } from '../../domain/enums/payment-type.enum';

@Injectable()
export class PaymentStrategyFactory {
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(
    private readonly mandatoryContributionStrategy: MandatoryContributionStrategy,
    private readonly stockFeeStrategy: StockFeeStrategy,
    private readonly loanPaymentStrategy: LoanPaymentStrategy,
    private readonly feeStrategy: FeeStrategy,
    private readonly insuranceStrategy: InsuranceStrategy,
    private readonly defaultPaymentStrategy: DefaultPaymentStrategy,
    private readonly noveltyPaymentStrategy: NoveltyPaymentStrategy,
  ) {
    this.strategies.set(
      PaymentType.MANDATORY_CONTRIBUTION,
      this.mandatoryContributionStrategy,
    );
    this.strategies.set(PaymentType.STOCK_FEE, this.stockFeeStrategy);
    this.strategies.set(PaymentType.LOAN_PAYMENT, this.loanPaymentStrategy);
    this.strategies.set(PaymentType.FEE, this.feeStrategy);
    this.strategies.set(PaymentType.INSURANCE, this.insuranceStrategy);
    this.strategies.set(PaymentType.NOVELTY, this.noveltyPaymentStrategy);
  }

  getStrategy(paymentType: MemberDue['type']): PaymentStrategy {
    return this.strategies.get(paymentType) ?? this.defaultPaymentStrategy;
  }
}
