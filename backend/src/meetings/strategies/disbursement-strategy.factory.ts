import { Injectable } from '@nestjs/common';
import { DisbursementStrategy } from './disbursement-strategy.interface';
import { StockWithdrawalStrategy } from './stock-withdrawal.strategy';
import { DisbursementType } from '../dto/disbursement-plan.dto';

@Injectable()
export class DisbursementStrategyFactory {
  constructor(
    private readonly stockWithdrawalStrategy: StockWithdrawalStrategy,
    // Aquí se pueden inyectar más estrategias en el futuro
  ) {}

  getStrategy(type: DisbursementType): DisbursementStrategy {
    switch (type) {
      case DisbursementType.RETIRO_ACCION:
        return this.stockWithdrawalStrategy;
      // case DisbursementType.OTRO_TIPO:
      //   return this.otroTipoStrategy;
      default:
        throw new Error(
          `No existe estrategia para el tipo de desembolso: ${type}`,
        );
    }
  }
}
