/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { CASH_ACCOUNT } from '@domain/constants/account-types';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { Loan } from '@domain/entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Operation } from '@domain/entities/operation.entity';
import { AuditEventType } from '@domain/enums/audit-event-type.enum';
import { LoanStatus } from '@domain/enums/loan-status.enum';
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
import { UndoMonthlyPaymentUseCase } from './undo-monthly-payment.use-case';

describe('UndoMonthlyPaymentUseCase', () => {
  let useCase: UndoMonthlyPaymentUseCase;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let auditLogRepository: jest.Mocked<AuditLogRepository>;
  let transactionManager: jest.Mocked<TransactionManager>;

  const meetingId = '11111111-1111-4111-8111-111111111111';
  const operationId = '22222222-2222-4222-8222-222222222222';
  const memberId = '33333333-3333-4333-8333-333333333333';
  const loanId = '44444444-4444-4444-8444-444444444444';

  const performedBy = {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'admin@example.com',
    role: 'admin',
  };

  const buildMeeting = (status: MeetingStatus = MeetingStatus.ACTIVE) =>
    Meeting.fromPersistence({
      id: meetingId,
      date: new Date('2026-11-24T10:00:00Z'),
      status,
    });

  const buildOperation = (
    type: OperationType = OperationType.MONTHLY_PAYMENT,
    opMeetingId: string = meetingId,
  ) =>
    Operation.fromPersistence({
      id: operationId,
      memberId,
      meetingId: opMeetingId,
      type,
      date: new Date('2026-11-24T11:00:00Z'),
      description: 'Cobro mensual',
    });

  const buildCashEntry = (amount: number, opId = operationId) =>
    LedgerEntry.fromPersistence({
      id: `entry-${Math.random()}`,
      operation_id: opId,
      account_type: CASH_ACCOUNT,
      amount,
      created_at: new Date('2026-11-24T11:00:00Z'),
    });

  const buildLoan = (
    outstandingBalance: number,
    status: LoanStatus = LoanStatus.ACTIVE,
  ) =>
    Loan.fromPersistence({
      id: loanId,
      member_id: memberId,
      loan_type: 'corriente',
      approved_amount: 1000,
      disbursed_amount: 1000,
      interest_rate: 0.02,
      monthly_payment_amount: 100,
      term: 10,
      outstanding_balance: outstandingBalance,
      status,
      creation_date: new Date('2026-10-01T10:00:00Z'),
    });

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      findLastClosed: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMeetingAndTypes: jest.fn(),
      findByMember: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      findWithPagination: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
      getAccountsSummary: jest.fn(),
      deleteByOperation: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    loanRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    loanTransactionDetailRepository = {
      findById: jest.fn(),
      findByLoan: jest.fn(),
      findByLoanWithPagination: jest.fn(),
      findByLoans: jest.fn(),
      findByLoanAndMeeting: jest.fn(),
      findByLoansAndMeeting: jest.fn(),
      findByOperationIds: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      deleteByOperation: jest.fn(),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

    auditLogRepository = {
      save: jest
        .fn()
        .mockImplementation((log: Parameters<AuditLogRepository['save']>[0]) =>
          Promise.resolve(log),
        ),
      findByEntity: jest.fn(),
      findByMeeting: jest.fn(),
      findWithPagination: jest.fn(),
    };

    transactionManager = {
      execute: jest
        .fn()
        .mockImplementation(<T>(fn: () => Promise<T>): Promise<T> => fn()),
      getActiveQueryRunner: jest.fn().mockReturnValue(null),
    };

    useCase = new UndoMonthlyPaymentUseCase(
      meetingRepository,
      operationRepository,
      ledgerEntryRepository,
      loanRepository,
      loanTransactionDetailRepository,
      auditLogRepository,
      transactionManager,
    );
  });

  it('should undo a MONTHLY_PAYMENT operation, save audit log before delete, and remove entries/operation', async () => {
    const callOrder: string[] = [];
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(buildMeeting());
    jest
      .spyOn(operationRepository, 'findByMeetingAndType')
      .mockResolvedValue([]);
    jest
      .spyOn(operationRepository, 'findById')
      .mockResolvedValue(buildOperation(OperationType.MONTHLY_PAYMENT));

    const cashEntry = buildCashEntry(500);
    jest
      .spyOn(ledgerEntryRepository, 'findByOperation')
      .mockResolvedValue([cashEntry]);
    jest
      .spyOn(ledgerEntryRepository, 'findByMeeting')
      .mockResolvedValue([cashEntry]);
    jest
      .spyOn(loanTransactionDetailRepository, 'findByOperationIds')
      .mockResolvedValue([]);

    const auditSpy = jest
      .spyOn(auditLogRepository, 'save')
      .mockImplementation((log) => {
        callOrder.push('audit.save');
        return Promise.resolve(log);
      });
    const deleteEntriesSpy = jest
      .spyOn(ledgerEntryRepository, 'deleteByOperation')
      .mockImplementation(() => {
        callOrder.push('ledger.delete');
        return Promise.resolve();
      });
    const deleteOpSpy = jest
      .spyOn(operationRepository, 'delete')
      .mockImplementation(() => {
        callOrder.push('operation.delete');
        return Promise.resolve();
      });

    const result = await useCase.execute({
      meetingId,
      operationId,
      reason: 'Error en monto',
      performedBy,
    });

    expect(result).toEqual({
      success: true,
      operationId,
      message: 'Operación anulada exitosamente',
    });
    expect(auditSpy).toHaveBeenCalledTimes(1);
    const savedLog = auditSpy.mock.calls[0][0];
    expect(savedLog.eventType).toBe(AuditEventType.OPERATION_DELETED);
    expect(savedLog.reason).toBe('Error en monto');
    expect(deleteEntriesSpy).toHaveBeenCalledWith(operationId);
    expect(deleteOpSpy).toHaveBeenCalledWith(operationId);
    expect(callOrder).toEqual([
      'audit.save',
      'ledger.delete',
      'operation.delete',
    ]);
  });

  it('should undo a LOAN_PAYMENT and restore loan balance and ACTIVE status when loan was PAID', async () => {
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(buildMeeting());
    jest
      .spyOn(operationRepository, 'findByMeetingAndType')
      .mockResolvedValue([]);
    jest
      .spyOn(operationRepository, 'findById')
      .mockResolvedValue(buildOperation(OperationType.LOAN_PAYMENT));

    const cashEntry = buildCashEntry(260);
    jest
      .spyOn(ledgerEntryRepository, 'findByOperation')
      .mockResolvedValue([cashEntry]);
    jest
      .spyOn(ledgerEntryRepository, 'findByMeeting')
      .mockResolvedValue([cashEntry]);

    const principalDetail = LoanTransactionDetail.fromPersistence({
      id: 'tx-1',
      loan_id: loanId,
      transaction_type: LoanTransactionType.PRINCIPAL_PAYMENT,
      amount: 250,
      transaction_date: new Date(),
      operation_id: operationId,
    });
    const interestDetail = LoanTransactionDetail.fromPersistence({
      id: 'tx-2',
      loan_id: loanId,
      transaction_type: LoanTransactionType.INTEREST_PAYMENT,
      amount: 10,
      transaction_date: new Date(),
      operation_id: operationId,
    });

    jest
      .spyOn(loanTransactionDetailRepository, 'findByOperationIds')
      .mockResolvedValue([principalDetail, interestDetail]);

    const loan = buildLoan(0, LoanStatus.PAID);
    jest.spyOn(loanRepository, 'findById').mockResolvedValue(loan);
    const loanSaveSpy = jest
      .spyOn(loanRepository, 'save')
      .mockResolvedValue(loan);
    const deleteLoanTxSpy = jest
      .spyOn(loanTransactionDetailRepository, 'deleteByOperation')
      .mockResolvedValue();

    await useCase.execute({
      meetingId,
      operationId,
      performedBy,
    });

    expect(loan.outstandingBalance).toBe(250);
    expect(loan.status).toBe(LoanStatus.ACTIVE);
    expect(loanSaveSpy).toHaveBeenCalledWith(loan);
    expect(deleteLoanTxSpy).toHaveBeenCalledWith(operationId);
  });

  it('should throw NotFoundError when meeting does not exist', async () => {
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(null);

    await expect(
      useCase.execute({ meetingId, operationId, performedBy }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BusinessRuleError when meeting is closed', async () => {
    jest
      .spyOn(meetingRepository, 'findById')
      .mockResolvedValue(buildMeeting(MeetingStatus.CLOSED));

    await expect(
      useCase.execute({ meetingId, operationId, performedBy }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError when ASSET_REVALUATION already exists in the meeting', async () => {
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(buildMeeting());
    jest
      .spyOn(operationRepository, 'findByMeetingAndType')
      .mockResolvedValue([buildOperation(OperationType.ASSET_REVALUATION)]);

    await expect(
      useCase.execute({ meetingId, operationId, performedBy }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw NotFoundError when operation does not exist', async () => {
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(buildMeeting());
    jest
      .spyOn(operationRepository, 'findByMeetingAndType')
      .mockResolvedValue([]);
    jest.spyOn(operationRepository, 'findById').mockResolvedValue(null);

    await expect(
      useCase.execute({ meetingId, operationId, performedBy }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw InvalidRequestError when operation belongs to a different meeting', async () => {
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(buildMeeting());
    jest
      .spyOn(operationRepository, 'findByMeetingAndType')
      .mockResolvedValue([]);
    jest
      .spyOn(operationRepository, 'findById')
      .mockResolvedValue(
        buildOperation(OperationType.MONTHLY_PAYMENT, 'other-meeting-id'),
      );

    await expect(
      useCase.execute({ meetingId, operationId, performedBy }),
    ).rejects.toThrow(InvalidRequestError);
  });

  it('should throw BusinessRuleError when operation type is not undoable in Step 1', async () => {
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(buildMeeting());
    jest
      .spyOn(operationRepository, 'findByMeetingAndType')
      .mockResolvedValue([]);
    jest
      .spyOn(operationRepository, 'findById')
      .mockResolvedValue(buildOperation(OperationType.STOCK_PURCHASE));

    await expect(
      useCase.execute({ meetingId, operationId, performedBy }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError when undoing would make meeting CASH balance negative', async () => {
    jest.spyOn(meetingRepository, 'findById').mockResolvedValue(buildMeeting());
    jest
      .spyOn(operationRepository, 'findByMeetingAndType')
      .mockResolvedValue([]);
    jest
      .spyOn(operationRepository, 'findById')
      .mockResolvedValue(buildOperation(OperationType.MONTHLY_PAYMENT));

    const collectionEntry = buildCashEntry(500, operationId);
    const disbursementEntry = buildCashEntry(-400, 'other-op');

    jest
      .spyOn(ledgerEntryRepository, 'findByOperation')
      .mockResolvedValue([collectionEntry]);
    jest
      .spyOn(ledgerEntryRepository, 'findByMeeting')
      .mockResolvedValue([collectionEntry, disbursementEntry]);
    jest
      .spyOn(loanTransactionDetailRepository, 'findByOperationIds')
      .mockResolvedValue([]);

    await expect(
      useCase.execute({ meetingId, operationId, performedBy }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
