import { DisbursementPriorityHelper } from './disbursement-priority.helper';
import {
  DisbursementPlanItemDto,
  DisbursementType,
} from '@application/dto/meetings/disbursement-plan-item.dto';
import { PendingMemberPayment } from '@domain/entities/pending-member-payment.entity';

describe('DisbursementPriorityHelper', () => {
  const meetingId = 'current-meeting-id';

  it('should assign Priority 1 to old debt with members (previous meetings)', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'm1',
      type: DisbursementType.WITHDRAWAL,
      amount: 100,
      pendingMemberPaymentId: 'p1',
    };
    const payment = PendingMemberPayment.fromPersistence({
      id: 'p1',
      member_id: 'm1',
      meeting_id: 'old-meeting',
      type: 'stock_withdrawal',
      amount: 100,
      status: 'pending',
      created_at: new Date(),
      reference_meeting_id: 'old-meeting',
    });

    const priority = DisbursementPriorityHelper.getPriority(
      item,
      meetingId,
      payment,
    );
    expect(priority).toBe(1);
  });

  it('should assign Priority 2 to old loan debt (pending disbursements)', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'm2',
      type: DisbursementType.LOAN,
      amount: 500,
      pendingMemberPaymentId: 'p2',
    };
    const payment = PendingMemberPayment.fromPersistence({
      id: 'p2',
      member_id: 'm2',
      meeting_id: 'old-meeting',
      type: 'loan',
      amount: 500,
      status: 'pending',
      created_at: new Date(),
      reference_meeting_id: 'old-meeting',
    });

    const priority = DisbursementPriorityHelper.getPriority(
      item,
      meetingId,
      payment,
    );
    expect(priority).toBe(2);
  });

  it('should assign Priority 2 to loans without pending payment ID (fallback for old loans)', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'm2',
      type: DisbursementType.LOAN,
      amount: 500,
      loanId: 'l1',
    };

    const priority = DisbursementPriorityHelper.getPriority(item, meetingId);
    expect(priority).toBe(2);
  });

  it('should assign Priority 3 to current period dividends', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'm3',
      type: DisbursementType.DIVIDEND,
      amount: 300,
      pendingMemberPaymentId: 'p3',
    };
    const payment = PendingMemberPayment.fromPersistence({
      id: 'p3',
      member_id: 'm3',
      meeting_id: meetingId,
      type: 'dividend',
      amount: 300,
      status: 'pending',
      created_at: new Date(),
      reference_meeting_id: meetingId,
    });

    const priority = DisbursementPriorityHelper.getPriority(
      item,
      meetingId,
      payment,
    );
    expect(priority).toBe(3);
  });

  it('should assign Priority 4 to new loan requests', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'm4',
      type: DisbursementType.LOAN,
      amount: 1000,
      newLoanRequest: {
        memberId: 'm4',
        amount: 1000,
        approvedAmount: 1000,
        loanType: 'corriente',
        interestRate: 0.02,
        monthlyPaymentAmount: 100,
      },
    };

    const priority = DisbursementPriorityHelper.getPriority(item, meetingId);
    expect(priority).toBe(4);
  });

  it('should assign Priority 5 to new stock withdrawal requests', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'm5',
      type: DisbursementType.WITHDRAWAL,
      amount: 200,
      disbursementStockRequest: {
        stockId: 's1',
      },
    };

    const priority = DisbursementPriorityHelper.getPriority(item, meetingId);
    expect(priority).toBe(5);
  });

  it('should assign Priority 6 to OTHER disbursement types without pending payment', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'm6',
      type: DisbursementType.OTHER,
      amount: 50,
    };

    const priority = DisbursementPriorityHelper.getPriority(item, meetingId);
    expect(priority).toBe(6);
  });

  it('should assign Priority 6 as fallback for unknown cases', () => {
    const item: DisbursementPlanItemDto = {
      memberId: 'mX',
      type: 'invalid' as unknown as DisbursementType,
      amount: 0,
    };

    const priority = DisbursementPriorityHelper.getPriority(item, meetingId);
    expect(priority).toBe(6);
  });
});
