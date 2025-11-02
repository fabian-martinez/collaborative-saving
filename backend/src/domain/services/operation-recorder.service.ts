import { Operation } from '../../operations/entities/operation.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { OperationType } from '../../common/enums/operation-type.enum';

export interface OperationContext {
  type: OperationType;
  description: string;
  meetingId: string;
  memberId?: string;
}

export interface LedgerEntrySpec {
  accountType: string;
  amount: number;
  description?: string;
  loanId?: string;
  stockId?: string;
  mandatoryContributionId?: string;
}

export interface OperationRecordResult {
  operation: Partial<Operation>;
  ledgerEntries: Partial<LedgerEntry>[];
}

export class OperationRecorder {
  /**
   * Crea una Operation y sus LedgerEntries asociados,
   * validando invariantes contables.
   */
  recordOperation(
    context: OperationContext,
    specs: LedgerEntrySpec[],
  ): OperationRecordResult {
    // Validar m?nimo 2 asientos
    if (specs.length < 2) {
      throw new Error('Debe haber al menos 2 asientos contables');
    }

    // Validar balance: sum(d?bitos) = sum(cr?ditos)
    const debits = specs
      .filter((spec) => spec.amount > 0)
      .reduce((sum, spec) => sum + Math.abs(spec.amount), 0);

    const credits = specs
      .filter((spec) => spec.amount < 0)
      .reduce((sum, spec) => sum + Math.abs(spec.amount), 0);

    const difference = Math.abs(debits - credits);
    if (difference > 0.01) {
      throw new Error('Los d?bitos deben igualar a los cr?ditos');
    }

    // Crear Operation (objeto plano que se convertir? en entidad al persistir)
    const operation: Partial<Operation> = {
      type: context.type,
      description: context.description,
      meeting_id: context.meetingId,
      member_id: context.memberId,
      date: new Date(),
    };

    // Crear LedgerEntries (objetos planos que se convertir?n en entidades al persistir)
    const ledgerEntries: Partial<LedgerEntry>[] = specs.map((spec) => ({
      account_type: spec.accountType,
      amount: spec.amount,
      description: spec.description,
      loan_id: spec.loanId,
      stock_id: spec.stockId,
      mandatory_contribution_id: spec.mandatoryContributionId,
      created_at: new Date(),
    }));

    return {
      operation,
      ledgerEntries,
    };
  }
}
