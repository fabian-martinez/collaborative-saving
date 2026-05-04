import { ExecuteDisbursementPlanUseCase } from './execute-disbursement-plan.use-case';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { ProcessLoanDisbursementUseCase } from './process-loan-disbursement.use-case';
import { ProcessStockWithdrawalDisbursementUseCase } from './process-stock-withdrawal-disbursement.use-case';
import { ProcessDividendDisbursementUseCase } from './process-dividend-disbursement.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { ExecuteDisbursementPlanDto } from '@application/dto/meetings/execute-disbursement-plan.dto';
import { DisbursementType } from '@application/dto/meetings/disbursement-plan-item.dto';
import { Meeting } from '@domain/entities/meeting.entity';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';

describe('ExecuteDisbursementPlanUseCase', () => {
  let useCase: ExecuteDisbursementPlanUseCase;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let processLoanDisbursementUseCase: jest.Mocked<ProcessLoanDisbursementUseCase>;
  let processStockWithdrawalDisbursementUseCase: jest.Mocked<ProcessStockWithdrawalDisbursementUseCase>;
  let processDividendDisbursementUseCase: jest.Mocked<ProcessDividendDisbursementUseCase>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let transactionExecuteMock: jest.Mock = jest.fn();
  let processLoanExecuteMock: jest.Mock = jest.fn();
  let processStockExecuteMock: jest.Mock = jest.fn();
  let processDividendExecuteMock: jest.Mock = jest.fn();

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    ledgerEntryRepository = {
      findById: jest.fn(),
      findByOperation: jest.fn(),
      findByOperations: jest.fn(),
      findByMeeting: jest.fn(),
      findByAccountType: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      sumByAccountType: jest.fn(),
    } as unknown as jest.Mocked<LedgerEntryRepository>;

    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    transactionExecuteMock = jest.fn(
      async (callback: () => Promise<unknown>) => {
        return await callback();
      },
    );
    transactionManager = {
      execute: transactionExecuteMock,
    } as unknown as jest.Mocked<TransactionManager>;

    processLoanExecuteMock = jest.fn();
    processLoanDisbursementUseCase = {
      execute: processLoanExecuteMock,
    } as unknown as jest.Mocked<ProcessLoanDisbursementUseCase>;

    processStockExecuteMock = jest.fn();
    processStockWithdrawalDisbursementUseCase = {
      execute: processStockExecuteMock,
    } as unknown as jest.Mocked<ProcessStockWithdrawalDisbursementUseCase>;

    processDividendExecuteMock = jest.fn();
    processDividendDisbursementUseCase = {
      execute: processDividendExecuteMock,
    } as unknown as jest.Mocked<ProcessDividendDisbursementUseCase>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new ExecuteDisbursementPlanUseCase(
      meetingRepository,
      ledgerEntryRepository,
      pendingMemberPaymentRepository,
      transactionManager,
      processLoanDisbursementUseCase,
      processStockWithdrawalDisbursementUseCase,
      processDividendDisbursementUseCase,
      recordOperationUseCase,
    );
  });

  it('should throw error when meeting not found', async () => {
    const dto: ExecuteDisbursementPlanDto = {
      meetingId: 'non-existent',
      plan: [],
    };

    meetingRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      MeetingNotFoundException,
    );
  });

  it('should throw error when meeting is closed', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });
    meeting.close();

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [],
    };

    meetingRepository.findById.mockResolvedValue(meeting);

    await expect(useCase.execute(dto)).rejects.toThrow(BusinessRuleError);
  });

  it('should throw error when total requested exceeds available cash', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.DIVIDEND,
          amount: 500,
        },
        {
          memberId: 'member-2',
          type: DisbursementType.LOAN,
          amount: 600,
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000, // Solo 1000 disponible, pero se solicita 1100
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);

    await expect(useCase.execute(dto)).rejects.toThrow(BusinessRuleError);
  });

  it('should execute plan successfully when cash is sufficient', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.DIVIDEND,
          amount: 500,
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);
    processDividendDisbursementUseCase.execute.mockResolvedValue(500);

    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(result.processedItems).toBe(1);
    expect(transactionExecuteMock).toHaveBeenCalled();
    expect(processDividendExecuteMock).toHaveBeenCalled();
  });

  it('should throw error when item amount is <= 0', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.DIVIDEND,
          amount: 0,
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);

    await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
  });

  it('should delegate to correct use case based on type', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.DIVIDEND,
          amount: 500,
        },
        {
          memberId: 'member-2',
          type: DisbursementType.LOAN,
          amount: 300,
        },
        {
          memberId: 'member-3',
          type: DisbursementType.WITHDRAWAL,
          amount: 200,
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);
    processDividendDisbursementUseCase.execute.mockResolvedValue(500);
    processLoanDisbursementUseCase.execute.mockResolvedValue(300);
    processStockWithdrawalDisbursementUseCase.execute.mockResolvedValue(200);

    await useCase.execute(dto);

    // Con el ordenamiento por prioridad:
    // 1. member-2 (LOAN sin newLoanRequest -> Prioridad 2) -> availableCash: 1000
    // 2. member-1 (DIVIDEND sin pendingId -> Prioridad 6) -> availableCash: 700
    // 3. member-3 (WITHDRAWAL sin pendingId -> Prioridad 6) -> availableCash: 200

    expect(processLoanExecuteMock).toHaveBeenCalledTimes(1);
    expect(processLoanExecuteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        availableCash: 1000,
      }),
    );

    expect(processDividendExecuteMock).toHaveBeenCalledTimes(1);
    expect(processDividendExecuteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        availableCash: 700,
      }),
    );

    expect(processStockExecuteMock).toHaveBeenCalledTimes(1);
    expect(processStockExecuteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        availableCash: 200,
      }),
    );
  });

  it('should process OTHER disbursement type', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.OTHER,
          amount: 200,
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-2',
      ledgerEntryIds: [],
    });
    pendingMemberPaymentRepository.findByIds.mockResolvedValue([]);
    pendingMemberPaymentRepository.findById.mockResolvedValue(null);
    pendingMemberPaymentRepository.save.mockResolvedValue(
      PendingMemberPayment.fromPersistence({
        id: 'payment-id',
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: 'dividend',
        amount: 1000,
        status: 'pending',
        created_at: new Date(),
      }),
    );

    const executeSpy = jest.spyOn(recordOperationUseCase, 'execute');
    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(result.processedItems).toBe(1);
    expect(executeSpy).toHaveBeenCalled();
  });

  it('should throw error when disbursed total exceeds initial available cash during processing', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.DIVIDEND,
          amount: 500,
        },
        {
          memberId: 'member-2',
          type: DisbursementType.DIVIDEND,
          amount: 600,
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting
      .mockResolvedValueOnce(ledgerEntries) // Initial calculation
      .mockResolvedValueOnce(ledgerEntries) // First item processing
      .mockResolvedValueOnce([
        // Second item processing - cash reduced
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 500, // Reduced after first disbursement
        }),
      ]);
    processDividendDisbursementUseCase.execute.mockResolvedValue(500);

    await expect(useCase.execute(dto)).rejects.toThrow(BusinessRuleError);
  });

  it('should throw error for invalid disbursement type', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: 'invalid' as DisbursementType,
          amount: 200,
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);

    await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
  });

  it('should handle OTHER disbursement with existing pending payment', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const pendingPayment = PendingMemberPayment.fromPersistence({
      id: 'pending-1',
      member_id: 'member-1',
      meeting_id: meeting.id,
      type: 'other',
      amount: 200,
      status: 'pending',
      created_at: new Date(),
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.OTHER,
          amount: 200,
          pendingMemberPaymentId: 'pending-1',
        },
      ],
    };

    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);
    pendingMemberPaymentRepository.findByIds.mockResolvedValue([
      pendingPayment,
    ]);
    pendingMemberPaymentRepository.findById.mockResolvedValue(pendingPayment);
    pendingMemberPaymentRepository.save.mockResolvedValue(pendingPayment);
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-2',
      ledgerEntryIds: [],
    });

    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(pendingPayment.status).toBe('paid');
  });

  it('should handle OTHER disbursement with full payment', async () => {
    const meeting = Meeting.create({
      date: new Date(),
      notes: 'Test meeting',
    });

    const dto: ExecuteDisbursementPlanDto = {
      meetingId: meeting.id,
      plan: [
        {
          memberId: 'member-1',
          type: DisbursementType.OTHER,
          amount: 200,
        },
      ],
    };

    // Initial cash balance is 200
    const initialLedgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 200,
      }),
    ];

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(initialLedgerEntries);
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-2',
      ledgerEntryIds: [],
    });
    pendingMemberPaymentRepository.save.mockResolvedValue(
      PendingMemberPayment.fromPersistence({
        id: 'payment-id',
        member_id: 'member-1',
        meeting_id: 'meeting-1',
        type: 'dividend',
        amount: 1000,
        status: 'pending',
        created_at: new Date(),
      }),
    );

    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(result.totalDisbursed).toBe(200);
  });

  it('should process disbursement items in the correct priority order according to ADR-0006', async () => {
    const meetingId = 'current-meeting-id';
    const meeting = Meeting.fromPersistence({
      id: meetingId,
      date: new Date(),
      status: 'active',
      notes: 'Current meeting',
    });

    // Desordenados a propósito
    const dto: ExecuteDisbursementPlanDto = {
      meetingId,
      plan: [
        {
          memberId: 'm5',
          type: DisbursementType.WITHDRAWAL,
          amount: 100,
          disbursementStockRequest: { stockId: 's1' },
        }, // Prioridad 5 (Nuevo retiro)
        {
          memberId: 'm4',
          type: DisbursementType.LOAN,
          amount: 400,
          newLoanRequest: {
            memberId: 'm4',
            amount: 400,
            approvedAmount: 400,
            loanType: 'corriente',
            interestRate: 0.02,
            monthlyPaymentAmount: 100,
          },
        }, // Prioridad 4 (Nuevo préstamo)
        {
          memberId: 'm3',
          type: DisbursementType.DIVIDEND,
          amount: 300,
          pendingMemberPaymentId: 'p3',
        }, // Prioridad 3 (Dividendo actual)
        {
          memberId: 'm2',
          type: DisbursementType.LOAN,
          amount: 200,
          pendingMemberPaymentId: 'p2',
        }, // Prioridad 2 (Préstamo antiguo)
        {
          memberId: 'm1',
          type: DisbursementType.WITHDRAWAL,
          amount: 100,
          pendingMemberPaymentId: 'p1',
        }, // Prioridad 1 (Deuda antigua socio)
        { memberId: 'm6', type: DisbursementType.OTHER, amount: 50 }, // Prioridad 6 (Otros)
      ],
    };

    // Mocks de los pagos pendientes
    const p1 = PendingMemberPayment.fromPersistence({
      id: 'p1',
      member_id: 'm1',
      meeting_id: 'old-meeting',
      type: 'stock_withdrawal',
      amount: 100,
      status: 'pending',
      created_at: new Date(),
      reference_meeting_id: 'old-meeting',
    });
    const p2 = PendingMemberPayment.fromPersistence({
      id: 'p2',
      member_id: 'm2',
      meeting_id: 'old-meeting',
      type: 'loan',
      amount: 200,
      status: 'pending',
      created_at: new Date(),
      reference_meeting_id: 'old-meeting',
    });
    const p3 = PendingMemberPayment.fromPersistence({
      id: 'p3',
      member_id: 'm3',
      meeting_id: meetingId,
      type: 'dividend',
      amount: 300,
      status: 'pending',
      created_at: new Date(),
      reference_meeting_id: meetingId,
    });

    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([
      LedgerEntry.create({
        operationId: 'op',
        accountType: CASH_ACCOUNT,
        amount: 5000,
      }),
    ]);

    pendingMemberPaymentRepository.findByIds.mockImplementation(
      (ids: string[]) => {
        const allPayments = { p1, p2, p3 };
        const result = ids
          .map((id) => allPayments[id as keyof typeof allPayments])
          .filter(Boolean);
        return Promise.resolve(result);
      },
    );

    processDividendExecuteMock.mockResolvedValue(300); // Para p3 y otros dividendos
    processLoanExecuteMock.mockResolvedValue(400); // Genérico
    processStockExecuteMock.mockResolvedValue(100); // Genérico
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op',
      ledgerEntryIds: [],
    });

    await useCase.execute(dto);

    // Verificar el orden de ejecución basado en los mocks llamados
    // 1. Deuda Antigua Socio (p1) -> Withdrawal
    // 2. Deuda Antigua Préstamo (p2) -> Loan
    // 3. Dividendo Actual (p3) -> Dividend
    // 4. Nuevo Préstamo (m4) -> Loan
    // 5. Nuevo Retiro (m5) -> Withdrawal
    // 6. Otros (m6) -> Other

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const call1 = processStockExecuteMock.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const call2 = processLoanExecuteMock.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const call3 = processDividendExecuteMock.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const call4 = processLoanExecuteMock.mock.calls[1][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const call5 = processStockExecuteMock.mock.calls[1][0];

    const calls = [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      call1.item.memberId, // p1 (m1)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      call2.item.memberId, // p2 (m2)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      call3.item.memberId, // p3 (m3)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      call4.item.memberId, // m4
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      call5.item.memberId, // m5
    ];

    expect(calls).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
  });
});
