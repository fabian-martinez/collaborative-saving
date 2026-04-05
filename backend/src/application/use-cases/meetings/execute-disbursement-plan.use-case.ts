import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { ProcessLoanDisbursementUseCase } from './process-loan-disbursement.use-case';
import { ProcessStockWithdrawalDisbursementUseCase } from './process-stock-withdrawal-disbursement.use-case';
import { ProcessDividendDisbursementUseCase } from './process-dividend-disbursement.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { ExecuteDisbursementPlanDto } from '@application/dto/meetings/execute-disbursement-plan.dto';
import { ExecuteDisbursementPlanResponseDto } from '@application/dto/meetings/execute-disbursement-plan-response.dto';
import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  OTHER_EXPENSES_ACCOUNT,
} from '@domain/constants/account-types';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';

/**
 * Execute Disbursement Plan Use Case
 *
 * Orchestrates the execution of a disbursement plan.
 * Validates available cash, executes disbursements atomically,
 * and delegates to specific use cases based on disbursement type.
 */
export class ExecuteDisbursementPlanUseCase {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly transactionManager: TransactionManager,
    private readonly processLoanDisbursementUseCase: ProcessLoanDisbursementUseCase,
    private readonly processStockWithdrawalDisbursementUseCase: ProcessStockWithdrawalDisbursementUseCase,
    private readonly processDividendDisbursementUseCase: ProcessDividendDisbursementUseCase,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(
    dto: ExecuteDisbursementPlanDto,
  ): Promise<ExecuteDisbursementPlanResponseDto> {
    return this.transactionManager.execute(async () => {
      // 1. Validar que meeting existe y está activo
      const meeting = await this.meetingRepository.findById(dto.meetingId);
      if (!meeting) {
        throw new MeetingNotFoundException(dto.meetingId);
      }

      if (meeting.isClosed()) {
        throw new BusinessRuleError(
          'No se pueden ejecutar desembolsos en una reunión cerrada',
        );
      }

      // 2. Obtener efectivo disponible inicial
      const initialAvailableCash = await this.calculateAvailableCash(
        dto.meetingId,
      );

      // 3. VALIDAR que efectivo >= total solicitado (antes de ejecutar)
      const totalRequested = dto.plan.reduce(
        (sum, item) => sum + item.amount,
        0,
      );

      if (totalRequested > initialAvailableCash) {
        throw new BusinessRuleError(
          `El monto total a desembolsar (${totalRequested}) excede el efectivo disponible (${initialAvailableCash})`,
        );
      }

      // 4. Trackear efectivo desembolsado acumulado
      let disbursedTotal = 0;
      let currentAvailableCash = initialAvailableCash;
      const processedItems: Array<{
        memberId: string;
        type: DisbursementType;
        requestedAmount: number;
        disbursedAmount: number;
      }> = [];

      // 5. Procesar cada item según tipo
      for (const item of dto.plan) {
        // Validar monto > 0
        if (item.amount <= 0) {
          throw new InvalidRequestError(
            `El monto del desembolso debe ser > 0. Item: ${item.type}`,
          );
        }

        // Procesar según tipo
        const disbursedAmount = await this.processDisbursementItem(
          item,
          dto.meetingId,
          currentAvailableCash,
        );

        disbursedTotal += disbursedAmount;
        currentAvailableCash -= disbursedAmount;
        processedItems.push({
          memberId: item.memberId,
          type: item.type,
          requestedAmount: item.amount,
          disbursedAmount,
        });

        // Validar que no excedemos el efectivo disponible inicial
        if (disbursedTotal > initialAvailableCash) {
          throw new BusinessRuleError(
            `El total desembolsado (${disbursedTotal}) excedió el efectivo disponible inicial (${initialAvailableCash})`,
          );
        }
      }

      // 6. Retornar resultado
      return {
        success: true,
        processedItems: processedItems.length,
        totalDisbursed: disbursedTotal,
        totalRequested,
      };
    });
  }

  private async calculateAvailableCash(meetingId: string): Promise<number> {
    const entries = await this.ledgerEntryRepository.findByMeeting(meetingId);
    const cashEntries = entries.filter(
      (entry) => entry.accountType === CASH_ACCOUNT,
    );
    return cashEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  private async processDisbursementItem(
    item: DisbursementPlanItemDto,
    meetingId: string,
    currentAvailableCash: number,
  ): Promise<number> {
    switch (item.type) {
      case DisbursementType.LOAN:
        // ProcessLoanDisbursementUseCase maneja su propio límite de efectivo
        await this.processLoanDisbursementUseCase.execute({
          item,
          meetingId,
          availableCash: currentAvailableCash,
        });
        // Retornar monto desembolsado (puede ser parcial)
        return Math.min(item.amount, currentAvailableCash);

      case DisbursementType.WITHDRAWAL:
        await this.processStockWithdrawalDisbursementUseCase.execute({
          item,
          meetingId,
          availableCash: currentAvailableCash,
        });
        // Retornar monto desembolsado (puede ser parcial)
        return Math.min(item.amount, currentAvailableCash);

      case DisbursementType.DIVIDEND:
        await this.processDividendDisbursementUseCase.execute({
          item,
          meetingId,
          availableCash: currentAvailableCash,
        });
        // Retornar monto desembolsado (puede ser parcial)
        return Math.min(item.amount, currentAvailableCash);

      case DisbursementType.OTHER:
        return await this.processOtherDisbursement(
          item,
          meetingId,
          currentAvailableCash,
        );

      default:
        throw new InvalidRequestError(
          `Tipo de desembolso no válido: ${String(item.type)}`,
        );
    }
  }

  private async processOtherDisbursement(
    item: DisbursementPlanItemDto,
    meetingId: string,
    availableCash: number,
  ): Promise<number> {
    // 1. Calcular monto máximo desembolsable
    const maxDisbursable = Math.min(item.amount, availableCash);

    if (maxDisbursable <= 0) {
      throw new BusinessRuleError(
        'No hay efectivo disponible para desembolsar este item',
      );
    }

    // 2. Obtener PendingMemberPayment existente si existe
    let pendingPayment: PendingMemberPayment | null = null;
    if (item.pendingMemberPaymentId) {
      pendingPayment = await this.pendingMemberPaymentRepository.findById(
        item.pendingMemberPaymentId,
      );
      if (pendingPayment) {
        // Aprobar automáticamente si está PENDING
        if (pendingPayment.status === 'pending') {
          pendingPayment.approve();
          await this.pendingMemberPaymentRepository.save(pendingPayment);
        }
      }
    } else {
      // Crear nuevo PendingMemberPayment si no existe
      pendingPayment = PendingMemberPayment.create({
        memberId: item.memberId,
        meetingId,
        type: PendingMemberPaymentType.OTHER,
        amount: item.amount,
        notes: item.notes || 'Otro desembolso',
      });
      pendingPayment.approve();
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    }

    // 3. Registrar operación contable por monto desembolsado
    await this.recordOperationUseCase.execute({
      memberId: item.memberId,
      meetingId,
      type: OperationType.OTHER_WITHDRAWAL,
      description: item.notes || `Otro desembolso - ${maxDisbursable}`,
      date: new Date(),
      entries: this.createOtherDisbursementLedgerEntries(maxDisbursable),
    });

    // 4. Manejar PendingMemberPayment según sea completo o parcial
    if (!pendingPayment) {
      throw new BusinessRuleError(
        'PendingMemberPayment should exist at this point',
      );
    }

    if (maxDisbursable >= pendingPayment.amount) {
      // Desembolso completo: marcar como PAID
      pendingPayment.markAsPaid();
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    } else {
      // Desembolso parcial: marcar original como PAID y crear nuevo por faltante
      const remainingAmount = pendingPayment.amount - maxDisbursable;

      pendingPayment.markAsPaid();
      await this.pendingMemberPaymentRepository.save(pendingPayment);

      // Crear nuevo PendingMemberPayment por faltante
      const newPendingPayment = PendingMemberPayment.create({
        memberId: item.memberId,
        meetingId,
        type: PendingMemberPaymentType.OTHER,
        amount: remainingAmount,
        notes: `Saldo pendiente - ${item.notes || ''}`.trim(),
      });
      newPendingPayment.approve();
      await this.pendingMemberPaymentRepository.save(newPendingPayment);
    }

    return maxDisbursable;
  }

  private createOtherDisbursementLedgerEntries(
    amount: number,
  ): Array<RecordOperationDto['entries'][0]> {
    return [
      {
        accountType: CASH_ACCOUNT,
        amount: -amount, // Crédito: disminución de efectivo
        description: 'Otro desembolso',
      },
      {
        accountType: OTHER_EXPENSES_ACCOUNT,
        amount: amount, // Débito: gasto
        description: 'Otro desembolso',
      },
    ];
  }
}
