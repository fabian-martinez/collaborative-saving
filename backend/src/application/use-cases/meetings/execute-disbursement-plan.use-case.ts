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
import { DisbursementPriorityHelper } from './disbursement-priority.helper';

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

      // 4. ORDENAR ítems según prioridad del ADR-0006 y pre-cargar pagos pendientes
      const { sortedPlan, paymentsMap } = await this.sortPlanByPriority(
        dto.plan,
        dto.meetingId,
      );

      // 5. Trackear efectivo desembolsado acumulado
      let disbursedTotal = 0;
      let currentAvailableCash = initialAvailableCash;
      const processedItems: Array<{
        memberId: string;
        type: DisbursementType;
        requestedAmount: number;
        disbursedAmount: number;
      }> = [];

      // 6. Procesar cada item según tipo
      for (const item of sortedPlan) {
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
          paymentsMap,
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

      // 7. Auto-aplazar pagos pendientes no procesados en esta reunión
      const allMeetingPayments =
        await this.pendingMemberPaymentRepository.findByMeeting(dto.meetingId);
      const processedPaymentIds = new Set(
        dto.plan
          .map((item) => item.pendingMemberPaymentId)
          .filter((id): id is string => !!id),
      );

      const paymentsToPostpone: PendingMemberPayment[] = [];
      for (const payment of allMeetingPayments) {
        if (
          (payment.status === 'pending' || payment.status === 'approved') &&
          !processedPaymentIds.has(payment.id)
        ) {
          const existingNotes = payment.notes || '';
          if (
            !existingNotes.includes('Saldo pendiente') &&
            !existingNotes.includes('saldo pendiente')
          ) {
            payment.update({
              notes: `Saldo pendiente (Aplazado) - ${existingNotes}`.trim(),
            });
            paymentsToPostpone.push(payment);
          }
        }
      }

      if (paymentsToPostpone.length > 0) {
        await this.pendingMemberPaymentRepository.saveMany(paymentsToPostpone);
      }

      // 8. Retornar resultado
      return {
        success: true,
        processedItems: processedItems.length,
        totalDisbursed: disbursedTotal,
        totalRequested,
      };
    });
  }

  /**
   * Ordena el plan de desembolsos según las prioridades del ADR-0006
   * y retorna los pagos pendientes pre-cargados para evitar consultas N+1.
   */
  private async sortPlanByPriority(
    plan: DisbursementPlanItemDto[],
    meetingId: string,
  ): Promise<{
    sortedPlan: DisbursementPlanItemDto[];
    paymentsMap: Map<string, PendingMemberPayment>;
  }> {
    // 1. Obtener todos los pagos pendientes necesarios para determinar prioridad
    const paymentIds = plan
      .map((item) => item.pendingMemberPaymentId)
      .filter((id): id is string => !!id);

    const paymentsMap = new Map<string, PendingMemberPayment>();

    if (paymentIds.length > 0) {
      // ⚡ Bolt Performance Optimization:
      // Replaced iterative findById calls (N+1 query problem) with a single
      // batched findByIds call. This significantly reduces database roundtrips
      // from O(N) to O(1) for retrieving pending payments, improving the
      // overall execution time of the disbursement plan sorting operation.
      const payments =
        await this.pendingMemberPaymentRepository.findByIds(paymentIds);
      for (const payment of payments) {
        paymentsMap.set(payment.id, payment);
      }
    }

    // 2. Ordenar ítems usando el helper de prioridad
    const sortedPlan = [...plan].sort((a, b) => {
      const priorityA = DisbursementPriorityHelper.getPriority(
        a,
        meetingId,
        paymentsMap.get(a.pendingMemberPaymentId || ''),
      );
      const priorityB = DisbursementPriorityHelper.getPriority(
        b,
        meetingId,
        paymentsMap.get(b.pendingMemberPaymentId || ''),
      );

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Si tienen la misma prioridad, mantener orden original (estable) o por monto
      return 0;
    });

    return { sortedPlan, paymentsMap };
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
    paymentsMap: Map<string, PendingMemberPayment>,
  ): Promise<number> {
    switch (item.type) {
      case DisbursementType.LOAN:
        // ProcessLoanDisbursementUseCase maneja su propio límite de efectivo
        return await this.processLoanDisbursementUseCase.execute({
          item,
          meetingId,
          availableCash: currentAvailableCash,
        });

      case DisbursementType.WITHDRAWAL:
        return await this.processStockWithdrawalDisbursementUseCase.execute({
          item,
          meetingId,
          availableCash: currentAvailableCash,
        });

      case DisbursementType.DIVIDEND:
        return await this.processDividendDisbursementUseCase.execute({
          item,
          meetingId,
          availableCash: currentAvailableCash,
        });

      case DisbursementType.OTHER:
        return await this.processOtherDisbursement(
          item,
          meetingId,
          currentAvailableCash,
          paymentsMap,
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
    paymentsMap: Map<string, PendingMemberPayment>,
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
      // ⚡ Bolt Performance Optimization:
      // Replaced sequential findById calls inside the processing loop with
      // pre-fetched payments map lookups, preventing N+1 database queries.
      pendingPayment = paymentsMap.get(item.pendingMemberPaymentId) ?? null;
      if (!pendingPayment) {
        pendingPayment = await this.pendingMemberPaymentRepository.findById(
          item.pendingMemberPaymentId,
        );
      }
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
