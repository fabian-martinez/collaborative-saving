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
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';

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
    processDividendDisbursementUseCase.execute.mockResolvedValue(undefined);

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
    processDividendDisbursementUseCase.execute.mockResolvedValue(undefined);
    processLoanDisbursementUseCase.execute.mockResolvedValue(undefined);
    processStockWithdrawalDisbursementUseCase.execute.mockResolvedValue(
      undefined,
    );

    await useCase.execute(dto);

    expect(processDividendExecuteMock).toHaveBeenCalledTimes(1);
    expect(processLoanExecuteMock).toHaveBeenCalledTimes(1);
    expect(processStockExecuteMock).toHaveBeenCalledTimes(1);
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
    pendingMemberPaymentRepository.findById.mockResolvedValue(null);
    pendingMemberPaymentRepository.save.mockResolvedValue({} as any);

    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(result.processedItems).toBe(1);
    expect(recordOperationUseCase.execute).toHaveBeenCalled();
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
    processDividendDisbursementUseCase.execute.mockResolvedValue(undefined);

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
          type: 'invalid' as any,
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

    const pendingPayment = {
      id: 'pending-1',
      memberId: 'member-1',
      meetingId: meeting.id,
      type: 'other' as const,
      amount: 200,
      status: 'pending' as const,
      approve: jest.fn(),
      markAsPaid: jest.fn(),
    };

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
    pendingMemberPaymentRepository.findById.mockResolvedValue(
      pendingPayment as any,
    );
    pendingMemberPaymentRepository.save.mockResolvedValue(
      pendingPayment as any,
    );
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-2',
      ledgerEntryIds: [],
    });

    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(pendingPayment.approve).toHaveBeenCalled();
  });

  it('should handle OTHER disbursement with partial payment', async () => {
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

    // Initial cash balance is 200 (enough for validation)
    // But during processing, available cash becomes 100 (partial)
    const initialLedgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 200,
      }),
    ];

    // Mock calculateAvailableCash to return 100 during processing (simulating cash reduction)
    meetingRepository.findById.mockResolvedValue(meeting);
    ledgerEntryRepository.findByMeeting
      .mockResolvedValueOnce(initialLedgerEntries) // Initial check
      .mockResolvedValueOnce([
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: 100, // Reduced cash during processing
        }),
      ]); // During processing
    recordOperationUseCase.execute.mockResolvedValue({
      operationId: 'op-2',
      ledgerEntryIds: [],
    });
    pendingMemberPaymentRepository.save.mockResolvedValue({} as any);

    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(result.totalDisbursed).toBe(100); // Partial disbursement
  });
});
