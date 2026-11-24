/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { CASH_ACCOUNT } from '@domain/constants/account-types';
import { AuditLog } from '@domain/entities/audit-log.entity';
import { Loan } from '@domain/entities/loan.entity';
import { LoanTransactionType } from '@domain/entities/loan-transaction-detail.entity';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';
import { MeetingStatus } from '@domain/enums/meeting-status.enum';
import { OperationType } from '@domain/enums/operation-type.enum';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { NotFoundError } from '@domain/errors/not-found.error';
import { AuditLogRepository } from '@domain/ports/repositories/audit-log-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { UndoOperationDto } from '../../dto/meetings/undo-operation.dto';
import { UndoOperationResponseDto } from '../../dto/meetings/undo-operation-response.dto';

const STEP_1_UNDOABLE_OPERATION_TYPES = new Set<OperationType>([
  OperationType.MONTHLY_PAYMENT,
  OperationType.LOAN_PAYMENT,
  OperationType.MANDATORY_CONTRIBUTION,
  OperationType.STOCK_FEE,
  OperationType.FEE,
  OperationType.INSURANCE_PAYMENT,
]);

interface RevertedLoanSnapshot {
  loanId: string;
  principalPaid: number;
  interestPaid: number;
  previousBalance: number;
  newBalance: number;
  previousStatus: string;
  newStatus: string;
}

/**
 * Atomically undoes a Step 1 collection operation in an active meeting:
 * validates business rules, persists an immutable audit snapshot,
 * restores affected loan balances/statuses, and physically deletes
 * loan transaction details, ledger entries, and the operation.
 */
export class UndoMonthlyPaymentUseCase {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly operationRepository: OperationRepository,
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(dto: UndoOperationDto): Promise<UndoOperationResponseDto> {
    return this.transactionManager.execute(async () => {
      const meeting = await this.meetingRepository.findById(dto.meetingId);
      if (!meeting) {
        throw new NotFoundError('Meeting', dto.meetingId);
      }

      if (String(meeting.status) !== String(MeetingStatus.ACTIVE)) {
        throw new BusinessRuleError(
          'Solo se pueden anular operaciones de una reunión activa.',
        );
      }

      const revaluations = await this.operationRepository.findByMeetingAndType(
        dto.meetingId,
        OperationType.ASSET_REVALUATION,
      );
      if (revaluations.length > 0) {
        throw new BusinessRuleError(
          'No se puede anular un cobro del Paso 1 porque la revalorización (Paso 2) ya fue confirmada. Anule primero la revalorización.',
        );
      }

      const operation = await this.operationRepository.findById(
        dto.operationId,
      );
      if (!operation) {
        throw new NotFoundError('Operation', dto.operationId);
      }

      if (operation.meetingId !== dto.meetingId) {
        throw new InvalidRequestError(
          'La operación no pertenece a la reunión indicada.',
        );
      }

      if (!STEP_1_UNDOABLE_OPERATION_TYPES.has(operation.type)) {
        throw new BusinessRuleError(
          `El tipo de operación ${operation.type} no puede anularse desde el Paso 1.`,
        );
      }

      const [operationEntries, meetingEntries, loanTxDetails] =
        await Promise.all([
          this.ledgerEntryRepository.findByOperation(operation.id),
          this.ledgerEntryRepository.findByMeeting(dto.meetingId),
          this.loanTransactionDetailRepository.findByOperationIds([
            operation.id,
          ]),
        ]);

      const currentCashBalance = meetingEntries
        .filter((entry) => entry.accountType === CASH_ACCOUNT)
        .reduce((sum, entry) => sum + entry.amount, 0);

      const operationCashImpact = operationEntries
        .filter((entry) => entry.accountType === CASH_ACCOUNT)
        .reduce((sum, entry) => sum + entry.amount, 0);

      const projectedCashBalance = Number(
        (currentCashBalance - operationCashImpact).toFixed(2),
      );
      if (projectedCashBalance < 0) {
        throw new BusinessRuleError(
          'No se puede anular la operación porque dejaría el saldo de caja (CASH) de la reunión en negativo.',
        );
      }

      const loanAmountsByLoanId = new Map<
        string,
        { principalPaid: number; interestPaid: number }
      >();

      for (const detail of loanTxDetails) {
        const current = loanAmountsByLoanId.get(detail.loanId) ?? {
          principalPaid: 0,
          interestPaid: 0,
        };
        if (
          String(detail.transactionType) ===
          String(LoanTransactionType.PRINCIPAL_PAYMENT)
        ) {
          current.principalPaid = Number(
            (current.principalPaid + detail.amount).toFixed(2),
          );
        } else if (
          String(detail.transactionType) ===
          String(LoanTransactionType.INTEREST_PAYMENT)
        ) {
          current.interestPaid = Number(
            (current.interestPaid + detail.amount).toFixed(2),
          );
        }
        loanAmountsByLoanId.set(detail.loanId, current);
      }

      const loansToSave: Loan[] = [];
      const revertedLoansSnapshot: RevertedLoanSnapshot[] = [];

      for (const [loanId, amounts] of loanAmountsByLoanId.entries()) {
        const loan = await this.loanRepository.findById(loanId);
        if (!loan) {
          throw new NotFoundError('Loan', loanId);
        }

        const previousBalance = loan.outstandingBalance;
        const previousStatus = loan.status;

        loan.revertPayment(amounts.principalPaid, amounts.interestPaid);

        loansToSave.push(loan);
        revertedLoansSnapshot.push({
          loanId: loan.id,
          principalPaid: amounts.principalPaid,
          interestPaid: amounts.interestPaid,
          previousBalance,
          newBalance: loan.outstandingBalance,
          previousStatus,
          newStatus: loan.status,
        });
      }

      const auditLog = AuditLog.create({
        eventType: AuditEventType.OPERATION_DELETED,
        entityType: 'operation',
        entityId: operation.id,
        meetingId: dto.meetingId,
        userId: dto.performedBy.id,
        userEmail: dto.performedBy.email,
        userRole: dto.performedBy.role,
        reason: dto.reason?.trim() || null,
        details: {
          operation: {
            id: operation.id,
            memberId: operation.memberId,
            meetingId: operation.meetingId,
            type: operation.type,
            date: operation.date.toISOString(),
            description: operation.description ?? null,
          },
          ledger_entries: operationEntries.map((entry) => ({
            id: entry.id,
            operationId: entry.operationId,
            accountType: entry.accountType,
            amount: entry.amount,
            description: entry.description ?? null,
            loanId: entry.loanId ?? null,
            stockId: entry.stockId ?? null,
            mandatoryContributionId: entry.mandatoryContributionId ?? null,
            stockSubscriptionId: entry.stockSubscriptionId ?? null,
            createdAt: entry.createdAt.toISOString(),
          })),
          loan_transaction_details: loanTxDetails.map((detail) => ({
            id: detail.id,
            loanId: detail.loanId,
            operationId: detail.operationId ?? null,
            transactionType: detail.transactionType,
            amount: detail.amount,
            transactionDate: detail.transactionDate.toISOString(),
            notes: detail.notes ?? null,
          })),
          reverted_loans: revertedLoansSnapshot,
        },
      });

      await this.auditLogRepository.save(auditLog);

      for (const loan of loansToSave) {
        await this.loanRepository.save(loan);
      }

      if (loanTxDetails.length > 0) {
        await this.loanTransactionDetailRepository.deleteByOperation(
          operation.id,
        );
      }

      await this.ledgerEntryRepository.deleteByOperation(operation.id);
      await this.operationRepository.delete(operation.id);

      return {
        success: true,
        operationId: operation.id,
        message: 'Operación anulada exitosamente',
      };
    });
  }
}
