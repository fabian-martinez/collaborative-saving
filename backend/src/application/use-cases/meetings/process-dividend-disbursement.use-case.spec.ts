import { ProcessDividendDisbursementUseCase } from './process-dividend-disbursement.use-case';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
  PendingMemberPaymentStatus,
} from '@domain/entities/pending-member-payment.entity';
import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import { NotFoundError } from '@domain/errors/not-found.error';
import { BusinessRuleError } from '@domain/errors/business-rule.error';

describe('ProcessDividendDisbursementUseCase', () => {
  let useCase: ProcessDividendDisbursementUseCase;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;

  beforeEach(() => {
    const findByIdMock = jest.fn();
    const findByMemberMock = jest.fn();
    const findByMeetingMock = jest.fn();
    const findPendingByMeetingMock = jest.fn();
    const saveMock = jest.fn();
    pendingMemberPaymentRepository = {
      findById: findByIdMock,
      findByMember: findByMemberMock,
      findByMeeting: findByMeetingMock,
      findPendingByMeeting: findPendingByMeetingMock,
      save: saveMock,
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

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

    const executeMock = jest.fn();
    recordOperationUseCase = {
      execute: executeMock,
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new ProcessDividendDisbursementUseCase(
      pendingMemberPaymentRepository,
      ledgerEntryRepository,
      recordOperationUseCase,
    );
  });

  describe('with existing PendingMemberPayment', () => {
    it('should approve pending payment and disburse full amount', async () => {
      const meetingId = 'meeting-1';
      const pendingPayment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId,
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 500,
        notes: 'Dividend',
      });
      // Status is PENDING

      const item: DisbursementPlanItemDto = {
        memberId: 'member-1',
        type: DisbursementType.DIVIDEND,
        amount: 500,
        pendingMemberPaymentId: pendingPayment.id,
      };

      const saveMock = jest.fn((p: PendingMemberPayment) => Promise.resolve(p));
      const findByIdMockFn = jest.fn().mockResolvedValue(pendingPayment);
      const executeMockFn = jest.fn().mockResolvedValue({
        operationId: 'op-1',
        ledgerEntryIds: ['le-1', 'le-2'],
      });
      pendingMemberPaymentRepository.save = saveMock;
      pendingMemberPaymentRepository.findById = findByIdMockFn;
      recordOperationUseCase.execute = executeMockFn;

      const result = await useCase.execute({
        item,
        meetingId,
        availableCash: 1000,
      });

      // Should approve pending payment and then mark as paid (full disbursement)
      expect(result).toBe(500);
      expect(saveMock).toHaveBeenCalledTimes(2); // Approve + markAsPaid
      expect(pendingPayment.status).toBe(PendingMemberPaymentStatus.PAID);

      // Should record operation
      expect(executeMockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: 'member-1',
          meetingId,
          type: 'DIVIDEND_PAYMENT',
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: 'CASH',
              amount: -500,
            }),
            expect.objectContaining({
              accountType: 'DIVIDEND_EXPENSE',
              amount: 500,
            }),
          ]) as unknown,
        }),
      );

      // Should mark as paid
      expect(pendingPayment.status).toBe(PendingMemberPaymentStatus.PAID);
    });

    it('should create new pending payment for partial disbursement', async () => {
      const meetingId = 'meeting-1';
      const pendingPayment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId,
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 1000,
      });

      const item: DisbursementPlanItemDto = {
        memberId: 'member-1',
        type: DisbursementType.DIVIDEND,
        amount: 1000,
        pendingMemberPaymentId: pendingPayment.id,
      };

      const saveMock2 = jest.fn((p: PendingMemberPayment) =>
        Promise.resolve(p),
      );
      const findByIdMockFn2 = jest.fn().mockResolvedValue(pendingPayment);
      const executeMockFn2 = jest.fn().mockResolvedValue({
        operationId: 'op-1',
        ledgerEntryIds: ['le-1', 'le-2'],
      });
      pendingMemberPaymentRepository.save = saveMock2;
      pendingMemberPaymentRepository.findById = findByIdMockFn2;
      recordOperationUseCase.execute = executeMockFn2;

      const result = await useCase.execute({
        item,
        meetingId,
        availableCash: 600, // Solo hay 600 disponible
      });

      // Should disburse 600
      expect(result).toBe(600);
      expect(executeMockFn2).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({ amount: -600 }),
            expect.objectContaining({ amount: 600 }),
          ]) as unknown,
        }),
      );

      // Should mark original as paid
      expect(pendingPayment.status).toBe(PendingMemberPaymentStatus.PAID);

      // Should create new pending payment for remaining 400
      expect(saveMock2).toHaveBeenCalledTimes(3); // Approve + markAsPaid + new pending
      const saveCalls = pendingMemberPaymentRepository.save.mock.calls;
      const newPendingPayment = saveCalls[saveCalls.length - 1]?.[0] as
        | PendingMemberPayment
        | undefined;
      expect(newPendingPayment?.amount).toBe(400);
      expect(newPendingPayment?.status).toBe(
        PendingMemberPaymentStatus.APPROVED,
      );
    });

    it('should throw error when pending payment not found', async () => {
      const item: DisbursementPlanItemDto = {
        memberId: 'member-1',
        type: DisbursementType.DIVIDEND,
        amount: 500,
        pendingMemberPaymentId: 'non-existent',
      };

      pendingMemberPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          item,
          meetingId: 'meeting-1',
          availableCash: 1000,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when amount exceeds pending payment amount', async () => {
      const meetingId = 'meeting-1';
      const pendingPayment = PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId,
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 500,
      });

      const item: DisbursementPlanItemDto = {
        memberId: 'member-1',
        type: DisbursementType.DIVIDEND,
        amount: 600, // Mayor que el pago pendiente
        pendingMemberPaymentId: pendingPayment.id,
      };

      pendingMemberPaymentRepository.findById.mockResolvedValue(pendingPayment);

      await expect(
        useCase.execute({
          item,
          meetingId,
          availableCash: 1000,
        }),
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('without existing PendingMemberPayment', () => {
    it('should create new pending payment and disburse', async () => {
      const meetingId = 'meeting-1';
      const item: DisbursementPlanItemDto = {
        memberId: 'member-1',
        type: DisbursementType.DIVIDEND,
        amount: 500,
        notes: 'New dividend',
      };

      const saveMock3 = jest.fn((p: PendingMemberPayment) =>
        Promise.resolve(p),
      );
      const executeMockFn3 = jest.fn().mockResolvedValue({
        operationId: 'op-1',
        ledgerEntryIds: ['le-1', 'le-2'],
      });
      pendingMemberPaymentRepository.save = saveMock3;
      recordOperationUseCase.execute = executeMockFn3;

      const result = await useCase.execute({
        item,
        meetingId,
        availableCash: 1000,
      });

      // Should create new pending payment and then mark as paid (full disbursement)
      expect(result).toBe(500);
      expect(saveMock3).toHaveBeenCalledTimes(2); // Create (with approve) + markAsPaid

      // First call: create and approve
      const createCall = saveMock3.mock.calls[0]?.[0] as
        | PendingMemberPayment
        | undefined;
      expect(createCall?.memberId).toBe('member-1');
      expect(createCall?.amount).toBe(500);
      expect(createCall?.type).toBe(PendingMemberPaymentType.DIVIDEND);

      // Second call: mark as paid after full disbursement
      const paidCall = saveMock3.mock.calls[1]?.[0] as
        | PendingMemberPayment
        | undefined;
      expect(paidCall?.status).toBe(PendingMemberPaymentStatus.PAID);

      // Should record operation
      expect(executeMockFn3).toHaveBeenCalled();
    });
  });

  it('should throw error when no cash available', async () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'member-1',
      type: DisbursementType.DIVIDEND,
      amount: 500,
    };

    pendingMemberPaymentRepository.save.mockImplementation(
      (p: PendingMemberPayment) => Promise.resolve(p),
    );

    await expect(
      useCase.execute({
        item,
        meetingId: 'meeting-1',
        availableCash: 0,
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should use item amount when less than available cash', async () => {
    const meetingId = 'meeting-1';
    const pendingPayment = PendingMemberPayment.create({
      memberId: 'member-1',
      meetingId,
      type: PendingMemberPaymentType.DIVIDEND,
      amount: 500,
    });

    const item: DisbursementPlanItemDto = {
      memberId: 'member-1',
      type: DisbursementType.DIVIDEND,
      amount: 500,
      pendingMemberPaymentId: pendingPayment.id,
    };

    const findByIdMockFn4 = jest.fn().mockResolvedValue(pendingPayment);
    const saveMock4 = jest.fn((p: PendingMemberPayment) => Promise.resolve(p));
    const executeMockFn4 = jest.fn().mockResolvedValue({
      operationId: 'op-1',
      ledgerEntryIds: ['le-1', 'le-2'],
    });
    pendingMemberPaymentRepository.findById = findByIdMockFn4;
    pendingMemberPaymentRepository.save = saveMock4;
    recordOperationUseCase.execute = executeMockFn4;

    const result = await useCase.execute({
      item,
      meetingId,
      availableCash: 300, // Menos que el item amount
    });

    // Should disburse only 300 (min of item amount, available cash, pending amount)
    expect(result).toBe(300);
    expect(executeMockFn4).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ amount: -300 }),
        ]) as unknown,
      }),
    );
  });
});
