import { GetDisbursementPlanPreviewQueryHandler } from './get-disbursement-plan-preview.query-handler';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';

describe('GetDisbursementPlanPreviewQueryHandler', () => {
  let queryHandler: GetDisbursementPlanPreviewQueryHandler;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let ledgerEntryRepository: jest.Mocked<LedgerEntryRepository>;

  beforeEach(() => {
    pendingMemberPaymentRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByMeeting: jest.fn(),
      findPendingByMeeting: jest.fn(),
      save: jest.fn(),
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

    queryHandler = new GetDisbursementPlanPreviewQueryHandler(
      pendingMemberPaymentRepository,
      ledgerEntryRepository,
    );
  });

  it('should return empty plan when no pending payments', async () => {
    const meetingId = 'meeting-1';
    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan).toEqual([]);
    expect(result.availableCash).toBe(0);
    expect(result.totalToDisburse).toBe(0);
    const findPendingByMeetingSpy = jest.spyOn(
      pendingMemberPaymentRepository,
      'findPendingByMeeting',
    );
    expect(findPendingByMeetingSpy).toHaveBeenCalledWith(meetingId);
  });

  it('should calculate available cash from ledger entries', async () => {
    const meetingId = 'meeting-1';
    const ledgerEntries = [
      LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
      }),
      LedgerEntry.create({
        operationId: 'op-2',
        accountType: CASH_ACCOUNT,
        amount: -200,
      }),
      LedgerEntry.create({
        operationId: 'op-3',
        accountType: 'LOANS_RECEIVABLE',
        amount: 500, // No cuenta para efectivo
      }),
      LedgerEntry.create({
        operationId: 'op-4',
        accountType: CASH_ACCOUNT,
        amount: 300,
      }),
    ];

    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue(ledgerEntries);

    const result = await queryHandler.execute(meetingId);

    expect(result.availableCash).toBe(1100); // 1000 - 200 + 300
  });

  it('should map dividend pending payment to plan item', async () => {
    const meetingId = 'meeting-1';
    const pendingPayment = PendingMemberPayment.create({
      memberId: 'member-1',
      meetingId,
      type: PendingMemberPaymentType.DIVIDEND,
      amount: 500,
      notes: 'Dividend payment',
    });
    pendingPayment.approve();

    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([
      pendingPayment,
    ]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan).toHaveLength(1);
    expect(result.plan[0].memberId).toBe('member-1');
    expect(result.plan[0].type).toBe('dividend');
    expect(result.plan[0].amount).toBe(500);
    expect(result.plan[0].notes).toBe('Dividend payment');
    expect(result.plan[0].pendingMemberPaymentId).toBe(pendingPayment.id);
    expect(result.totalToDisburse).toBe(500);
  });

  it('should map loan pending payment to plan item', async () => {
    const meetingId = 'meeting-1';
    const pendingPayment = PendingMemberPayment.create({
      memberId: 'member-1',
      meetingId,
      type: PendingMemberPaymentType.LOAN,
      amount: 2000,
      loanId: 'loan-1',
    });
    pendingPayment.approve();

    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([
      pendingPayment,
    ]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan).toHaveLength(1);
    expect(result.plan[0].type).toBe('loan');
    expect(result.plan[0].loanId).toBe('loan-1');
    expect(result.plan[0].amount).toBe(2000);
  });

  it('should map stock withdrawal pending payment to plan item', async () => {
    const meetingId = 'meeting-1';
    const pendingPayment = PendingMemberPayment.create({
      memberId: 'member-1',
      meetingId,
      type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
      amount: 1500,
      stockId: 'stock-1',
      stockSubscriptionId: 'sub-1',
    });
    pendingPayment.approve();

    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([
      pendingPayment,
    ]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan).toHaveLength(1);
    expect(result.plan[0].type).toBe('withdrawal');
    expect(result.plan[0].stockSubscriptionId).toBe('sub-1');
    expect(result.plan[0].disbursementStockRequest?.stockId).toBe('stock-1');
  });

  it('should map other pending payment to plan item', async () => {
    const meetingId = 'meeting-1';
    const pendingPayment = PendingMemberPayment.create({
      memberId: 'member-1',
      meetingId,
      type: PendingMemberPaymentType.OTHER,
      amount: 800,
      notes: 'Other payment',
    });
    pendingPayment.approve();

    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([
      pendingPayment,
    ]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan).toHaveLength(1);
    expect(result.plan[0].type).toBe('other');
    expect(result.plan[0].amount).toBe(800);
  });

  it('should calculate total to disburse from all pending payments', async () => {
    const meetingId = 'meeting-1';
    const pendingPayments = [
      PendingMemberPayment.create({
        memberId: 'member-1',
        meetingId,
        type: PendingMemberPaymentType.DIVIDEND,
        amount: 500,
      }),
      PendingMemberPayment.create({
        memberId: 'member-2',
        meetingId,
        type: PendingMemberPaymentType.LOAN,
        amount: 2000,
      }),
      PendingMemberPayment.create({
        memberId: 'member-3',
        meetingId,
        type: PendingMemberPaymentType.OTHER,
        amount: 300,
      }),
    ];

    pendingPayments.forEach((p) => p.approve());
    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue(
      pendingPayments,
    );
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan).toHaveLength(3);
    expect(result.totalToDisburse).toBe(2800); // 500 + 2000 + 300
  });

  it('should not include disbursementStockRequest when stockId is missing', async () => {
    const meetingId = 'meeting-1';
    const pendingPayment = PendingMemberPayment.create({
      memberId: 'member-1',
      meetingId,
      type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
      amount: 1500,
      stockSubscriptionId: 'sub-1',
      // No stockId
    });
    pendingPayment.approve();

    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([
      pendingPayment,
    ]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan[0].disbursementStockRequest).toBeUndefined();
  });

  it('should include optional fields when present', async () => {
    const meetingId = 'meeting-1';
    const pendingPayment = PendingMemberPayment.create({
      memberId: 'member-1',
      meetingId,
      type: PendingMemberPaymentType.LOAN,
      amount: 2000,
      loanId: 'loan-1',
      stockSubscriptionId: 'sub-1',
      notes: 'Loan notes',
    });
    pendingPayment.approve();

    pendingMemberPaymentRepository.findPendingByMeeting.mockResolvedValue([
      pendingPayment,
    ]);
    ledgerEntryRepository.findByMeeting.mockResolvedValue([]);

    const result = await queryHandler.execute(meetingId);

    expect(result.plan[0].loanId).toBe('loan-1');
    expect(result.plan[0].stockSubscriptionId).toBe('sub-1');
    expect(result.plan[0].notes).toBe('Loan notes');
  });
});
