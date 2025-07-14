import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { StockWithdrawalStrategy } from './stock-withdrawal.strategy';
import { DisbursementType } from '../dto/disbursement-plan.dto';
import { NewLoanDisbursementStrategy } from './new-loan-disbursement.strategy';
import { OtherDisbursementStrategy } from './other-disbursement.strategy';

@Injectable()
export class DisbursementStrategyFactory {
  constructor(
    private readonly stockWithdrawalStrategy: StockWithdrawalStrategy,
    private readonly newLoanDisbursementStrategy: NewLoanDisbursementStrategy,
    private readonly otherDisbursementStrategy: OtherDisbursementStrategy,
    // Aquí se pueden inyectar más estrategias en el futuro
  ) {}

  getStrategy(type: DisbursementType): DisbursementStrategy {
    switch (type) {
      case DisbursementType.RETIRO_ACCION:
        return this.stockWithdrawalStrategy;
      case DisbursementType.NUEVO_PRESTAMO:
        return this.newLoanDisbursementStrategy;
      case DisbursementType.OTRO:
        return this.otherDisbursementStrategy;
      default:
        throw new Error(
          `No existe estrategia para el tipo de desembolso: ${type}`,
        );
    }
  }
}
