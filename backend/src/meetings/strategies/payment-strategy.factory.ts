import { Injectable } from '@nestjs/common';
import { MemberDue } from '../../dues/entities/member-due.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { MandatoryContributionStrategy } from './mandatory-contribution.strategy';
import { StockFeeStrategy } from './stock-fee.strategy';
import { LoanPaymentStrategy } from './loan-payment.strategy';
import { FeeStrategy } from './fee.strategy';
import { InsuranceStrategy } from './insurance.strategy';
import { DefaultPaymentStrategy } from './default-payment.strategy';

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
  ) {
    this.strategies.set(
      'mandatory_contribution',
      this.mandatoryContributionStrategy,
    );
    this.strategies.set('stock_fee', this.stockFeeStrategy);
    this.strategies.set('loan_payment', this.loanPaymentStrategy);
    this.strategies.set('fee', this.feeStrategy);
    this.strategies.set('insurance', this.insuranceStrategy);
  }

  getStrategy(paymentType: MemberDue['type']): PaymentStrategy {
    return this.strategies.get(paymentType) ?? this.defaultPaymentStrategy;
  }
}
