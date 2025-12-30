import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { LOAN_CONSTANTS } from '@domain/constants/business-rules.constants';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { DisbursementPlanItemDto } from '@application/dto/meetings/disbursement-plan-item.dto';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
} from '@domain/constants/account-types';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { NotFoundError } from '@domain/errors/not-found.error';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';

/**
 * Process Loan Disbursement Use Case
 *
 * Processes loan disbursements for new loans or pending loans.
 * Handles partial disbursements and creates PendingMemberPayment when needed.
 */
export class ProcessLoanDisbursementUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: {
    item: DisbursementPlanItemDto;
    meetingId: string;
    availableCash: number;
  }): Promise<void> {
    const { item, meetingId, availableCash } = dto;

    // 1. Si es un nuevo préstamo, usar CreateLoanUseCase
    if (item.newLoanRequest) {
      // Obtener member y meeting para validar
      const member = await this.memberRepository.findById(item.memberId);
      if (!member) {
        throw new MemberNotFoundException(item.memberId);
      }

      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw new MeetingNotFoundException(meetingId);
      }

      // Validar que el tipo de préstamo sea válido para CreateLoanUseCase
      // CreateLoanUseCase solo acepta 'corriente' | 'agil' | 'accion'
      // Si es 'prioritario', tratarlo como 'corriente'
      let loanTypeForCreate: 'corriente' | 'agil' | 'accion';
      if (item.newLoanRequest.loanType === 'prioritario') {
        loanTypeForCreate = 'corriente';
      } else if (
        item.newLoanRequest.loanType === 'corriente' ||
        item.newLoanRequest.loanType === 'agil' ||
        item.newLoanRequest.loanType === 'accion'
      ) {
        loanTypeForCreate = item.newLoanRequest.loanType;
      } else {
        throw new BusinessRuleError(
          `Tipo de préstamo no válido: ${String(item.newLoanRequest.loanType)}`,
        );
      }

      // Calcular el término del préstamo usando la fórmula de amortización
      // n = -log(1 - (P * r) / A) / log(1 + r)
      // donde: n = número de períodos, P = principal, r = tasa mensual, A = pago mensual
      let calculatedTerm: number;
      const principal = item.newLoanRequest.approvedAmount;
      const monthlyRate = item.newLoanRequest.interestRate / 12;
      const monthlyPayment = item.newLoanRequest.monthlyPaymentAmount;

      if (monthlyPayment <= 0) {
        // Si el pago mensual es 0, usar un término por defecto
        calculatedTerm = LOAN_CONSTANTS.MAX_TERM_MONTHS;
      } else if (monthlyRate <= 0) {
        // Si no hay interés, calcular término simple
        calculatedTerm = Math.ceil(principal / monthlyPayment);
      } else {
        // Calcular usando fórmula de amortización
        const numerator = 1 - (principal * monthlyRate) / monthlyPayment;
        if (numerator <= 0) {
          // El pago mensual es muy pequeño, usar cálculo simple
          calculatedTerm = Math.ceil(principal / monthlyPayment);
        } else {
          calculatedTerm = Math.ceil(
            -Math.log(numerator) / Math.log(1 + monthlyRate),
          );
        }
      }

      // Asegurar que el término sea al menos 1
      calculatedTerm = Math.max(1, calculatedTerm);

      // CreateLoanUseCase ya maneja efectivo disponible y desembolsos parciales
      await this.createLoanUseCase.execute({
        memberId: item.memberId,
        meetingId,
        loanType: loanTypeForCreate,
        approvedAmount: item.newLoanRequest.approvedAmount,
        disbursedAmount: Math.min(item.amount, availableCash),
        monthlyPaymentAmount: item.newLoanRequest.monthlyPaymentAmount,
        interestRate: item.newLoanRequest.interestRate,
        term: calculatedTerm,
        guaranteedStockId: null,
        outstandingBalance: item.newLoanRequest.approvedAmount,
      });
      return;
    }

    // 2. Si es un préstamo pendiente, procesar desembolso
    if (item.loanId) {
      await this.processPendingLoanDisbursement(item, meetingId, availableCash);
      return;
    }

    throw new BusinessRuleError(
      'Debe proporcionar newLoanRequest o loanId para desembolsos de préstamo',
    );
  }

  private async processPendingLoanDisbursement(
    item: DisbursementPlanItemDto,
    meetingId: string,
    availableCash: number,
  ): Promise<void> {
    // 1. Obtener préstamo
    const loan = await this.loanRepository.findById(item.loanId!);
    if (!loan) {
      throw new LoanNotFoundException(item.loanId!);
    }

    // 2. Validar reglas de negocio
    const loanStatus = loan.status;
    if (loanStatus !== 'pending' && loanStatus !== 'active') {
      throw new BusinessRuleError(
        `Solo se pueden desembolsar préstamos pendientes o activos. Estado actual: ${loanStatus}`,
      );
    }

    // Calcular monto máximo que se puede desembolsar
    const remainingApprovedAmount = loan.approvedAmount - loan.disbursedAmount;
    const maxDisbursable = Math.min(
      item.amount,
      availableCash,
      remainingApprovedAmount,
    );

    if (maxDisbursable <= 0) {
      throw new BusinessRuleError(
        'No hay efectivo disponible o monto aprobado restante para desembolsar este préstamo',
      );
    }

    // 3. Obtener PendingMemberPayment existente si existe
    let pendingPayment: PendingMemberPayment | null = null;
    if (item.pendingMemberPaymentId) {
      pendingPayment = await this.pendingMemberPaymentRepository.findById(
        item.pendingMemberPaymentId,
      );
      if (!pendingPayment) {
        throw new NotFoundError(
          'PendingMemberPayment',
          item.pendingMemberPaymentId,
        );
      }

      // Aprobar automáticamente si está PENDING
      if (pendingPayment.status === 'pending') {
        pendingPayment.approve();
        await this.pendingMemberPaymentRepository.save(pendingPayment);
      }
    }

    // 4. Actualizar préstamo usando método de dominio
    loan.disburse(maxDisbursable);
    await this.loanRepository.save(loan);

    // 5. Obtener member y meeting para la descripción
    const member = await this.memberRepository.findById(item.memberId);
    if (!member) {
      throw new MemberNotFoundException(item.memberId);
    }

    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new MeetingNotFoundException(meetingId);
    }

    // 6. Registrar operación contable usando RecordOperationUseCase
    const loanType = loan.loanType;
    const operationDescription =
      loanType === 'accion'
        ? `Desembolso de préstamo basado en acciones para el miembro ${member.name}`
        : `Desembolso de préstamo para el miembro ${member.name}`;

    const ledgerEntries = this.createLoanDisbursementLedgerEntries(
      loanType as 'corriente' | 'agil' | 'accion' | 'prioritario',
      maxDisbursable,
      loan.id,
    );

    const operationDto: RecordOperationDto = {
      memberId: item.memberId,
      meetingId,
      type: OperationType.LOAN_DISBURSEMENT,
      description: operationDescription,
      date: meeting.date,
      entries: ledgerEntries,
    };

    const operationResult =
      await this.recordOperationUseCase.execute(operationDto);

    // 7. Crear LoanTransactionDetail para el desembolso
    const transactionDetail = LoanTransactionDetail.create({
      loanId: loan.id,
      transactionType: LoanTransactionType.DISBURSEMENT,
      amount: maxDisbursable,
      operationId: operationResult.operationId,
      notes: item.notes || undefined,
    });
    await this.loanTransactionDetailRepository.save(transactionDetail);

    // 8. Manejar PendingMemberPayment según sea completo o parcial
    if (pendingPayment) {
      if (maxDisbursable >= pendingPayment.amount) {
        // Desembolso completo: marcar como PAID
        pendingPayment.markAsPaid();
        await this.pendingMemberPaymentRepository.save(pendingPayment);

        // Si el préstamo aún no está completamente desembolsado, crear nuevo PendingMemberPayment
        if (loan.disbursedAmount < loan.approvedAmount) {
          const remainingLoanAmount =
            loan.approvedAmount - loan.disbursedAmount;
          const newPendingPayment = PendingMemberPayment.create({
            memberId: item.memberId,
            meetingId,
            type: PendingMemberPaymentType.LOAN,
            amount: remainingLoanAmount,
            loanId: loan.id,
            notes: `Saldo pendiente de préstamo - ${item.notes || ''}`.trim(),
          });
          await this.pendingMemberPaymentRepository.save(newPendingPayment);
        }
      } else {
        // Desembolso parcial: marcar original como PAID y crear nuevo por faltante
        const remainingAmount = pendingPayment.amount - maxDisbursable;

        pendingPayment.markAsPaid();
        await this.pendingMemberPaymentRepository.save(pendingPayment);

        // Crear nuevo PendingMemberPayment por faltante
        const newPendingPayment = PendingMemberPayment.create({
          memberId: item.memberId,
          meetingId,
          type: PendingMemberPaymentType.LOAN,
          amount: remainingAmount,
          loanId: loan.id,
          notes: `Saldo pendiente de préstamo - ${item.notes || ''}`.trim(),
        });
        await this.pendingMemberPaymentRepository.save(newPendingPayment);
      }
    } else {
      // Si no había PendingMemberPayment pero el préstamo no está completamente desembolsado
      if (loan.disbursedAmount < loan.approvedAmount) {
        const remainingLoanAmount = loan.approvedAmount - loan.disbursedAmount;
        const newPendingPayment = PendingMemberPayment.create({
          memberId: item.memberId,
          meetingId,
          type: PendingMemberPaymentType.LOAN,
          amount: remainingLoanAmount,
          loanId: loan.id,
          notes: `Saldo pendiente de préstamo - ${item.notes || ''}`.trim(),
        });
        await this.pendingMemberPaymentRepository.save(newPendingPayment);
      }
    }
  }

  private createLoanDisbursementLedgerEntries(
    loanType: 'corriente' | 'agil' | 'accion' | 'prioritario',
    amount: number,
    loanId: string,
  ): Array<RecordOperationDto['entries'][0]> {
    if (loanType === 'accion') {
      // For 'accion' loans:
      // - LOANS_RECEIVABLE_ACCOUNT (debit, +amount)
      // - MEMBER_EQUITY_ACCOUNT (credit, -amount)
      return [
        {
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: amount,
          description: 'Desembolso de préstamo de acción',
          loanId: loanId,
        },
        {
          accountType: MEMBER_EQUITY_ACCOUNT,
          amount: -amount,
          description: 'Desembolso de préstamo de acción',
          loanId: loanId,
        },
      ];
    } else {
      // For 'corriente', 'agil', and 'prioritario' loans:
      // - CASH_ACCOUNT (credit, -amount) - money goes out
      // - LOANS_RECEIVABLE_ACCOUNT (debit, +amount) - loan receivable increases
      return [
        {
          accountType: CASH_ACCOUNT,
          amount: -amount,
          description: 'Desembolso de préstamo',
          loanId: loanId,
        },
        {
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: amount,
          description: 'Aumento de cuentas por cobrar (préstamo)',
          loanId: loanId,
        },
      ];
    }
  }
}
