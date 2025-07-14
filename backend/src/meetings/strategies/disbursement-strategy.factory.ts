import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { StockWithdrawalStrategy } from './stock-withdrawal.strategy';
import { DisbursementType } from '../dto/disbursement-plan.dto';
import { NewLoanDisbursementStrategy } from './new-loan-disbursement.strategy';
import { OtherDisbursementStrategy } from './other-disbursement.strategy';
import { PendingDisbursementStrategy } from './pending-disbursement.strategy';

@Injectable()
export class DisbursementStrategyFactory {
  constructor(
    private readonly stockWithdrawalStrategy: StockWithdrawalStrategy,
    private readonly newLoanDisbursementStrategy: NewLoanDisbursementStrategy,
    private readonly otherDisbursementStrategy: OtherDisbursementStrategy,
    private readonly pendingDisbursementStrategy: PendingDisbursementStrategy,
    // Aquí se pueden inyectar más estrategias en el futuro
  ) {}

  getStrategy(type: DisbursementType): DisbursementStrategy {
    switch (type) {
      case DisbursementType.WITHDRAWAL:
        return this.stockWithdrawalStrategy;
      case DisbursementType.LOAN:
        return this.newLoanDisbursementStrategy;
      case DisbursementType.OTHER:
        return this.otherDisbursementStrategy;
      case DisbursementType.DIVIDEND:
        return this.pendingDisbursementStrategy;
      default:
        throw new Error(`No existe estrategia de desembolso`);
    }
  }
}
