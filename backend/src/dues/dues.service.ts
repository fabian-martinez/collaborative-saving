import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Member } from '../members/entities/member.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { MeetingsService } from '../meetings/meetings.service';
import { MemberDue } from './entities/member-due.entity';
import { MandatoryContributionsService } from '../mandatory-contributions/mandatory-contributions.service';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { LoansService } from '../loans/loans.service';

@Injectable()
export class DuesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mandatoryContributionsService: MandatoryContributionsService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly loansService: LoansService,
    @Inject(forwardRef(() => MeetingsService))
    private readonly meetingsService: MeetingsService,
  ) {}

  async getMemberDues(memberId: string): Promise<MemberDue[]> {
    const dues: MemberDue[] = [];

    // 1. Mandatory fund contributions
    const mandatoryContributions =
      await this.mandatoryContributionsService.findAll();

    for (const contribution of mandatoryContributions) {
      if (contribution.value > 0) {
        dues.push({
          type: 'mandatory_contribution',
          description: contribution.asset_type,
          amount: Number(contribution.value),
        });
      }
    }

    // 2. Subscribed stock fees
    const activeSubscriptions =
      await this.stockSubscriptionsService.findActiveByMember(memberId);

    for (const subscription of activeSubscriptions) {
      if (subscription.stock && subscription.stock.monthly_contribution > 0) {
        dues.push({
          type: 'stock_fee',
          description: `Cuota de acción: ${subscription.stock.type}`,
          amount:
            subscription.quantity * subscription.stock.monthly_contribution,
        });
      }
    }

    // 3. Active loan payments
    const activeLoans = await this.loansService.findActiveByMember(memberId);

    for (const loan of activeLoans) {
      const interestDue = loan.outstanding_balance * loan.interest_rate;
      const principalDue = Number(loan.monthly_payment_amount);

      dues.push({
        type: 'loan_payment',
        description: `Cuota préstamo ${loan.loan_type}`,
        amount: Number(loan.monthly_payment_amount),
        referenceId: loan.id,
        details: {
          interest: interestDue,
          principal: principalDue,
          outstanding_balance: loan.outstanding_balance - principalDue,
        },
      });
    }

    return dues;
  }

  async getMemberDuesForActiveMeeting(memberId: string): Promise<MemberDue[]> {
    const activeMeeting = await this.meetingsService.findActive();
    if (!activeMeeting) {
      throw new NotFoundException('No active meeting found.');
    }

    const member = await this.dataSource.manager.findOne(Member, {
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found.`);
    }

    const dues: MemberDue[] = [];

    // --- Aportes y cuotas fijas ---
    const mandatoryContributions =
      await this.mandatoryContributionsService.findAll();

    for (const contribution of mandatoryContributions) {
      if (contribution.value > 0) {
        dues.push({
          type: 'mandatory_contribution',
          description: contribution.asset_type,
          amount: Number(contribution.value),
        });
      }
    }

    // --- Cuotas de acciones suscritas ---
    const subscriptions = await this.dataSource.manager.find(
      StockSubscription,
      {
        where: { member_id: memberId },
        relations: ['stock', 'financing_loan'],
      },
    );

    for (const subscription of subscriptions) {
      const dueAmount =
        subscription.quantity * Number(subscription.stock.monthly_contribution);
      if (dueAmount > 0) {
        dues.push({
          type: 'stock_fee',
          description: `Cuota de acción: ${subscription.stock.type}`,
          amount: dueAmount,
          referenceId: subscription.stock.id,
          monthlyContribution: Number(subscription.stock.monthly_contribution),
          stockQuantity: subscription.quantity,
        });
      }
    }

    // --- Cuotas de préstamos activos ---
    const loans = await this.dataSource.manager.find(Loan, {
      where: { member_id: memberId, status: 'active' },
      relations: ['transactions'],
    });

    for (const loan of loans) {
      if (
        loan.outstanding_balance > 0 &&
        loan.payment_status_this_month !== 'PAID'
      ) {
        const interestComponent =
          Number(loan.outstanding_balance) * Number(loan.interest_rate);
        const principalComponent = Number(loan.monthly_payment_amount);
        const totalPaymentDue = principalComponent + interestComponent;

        dues.push({
          type: 'loan_payment',
          description: `Cuota préstamo: ${loan.loan_type}`,
          amount: totalPaymentDue,
          referenceId: loan.id,
          details: {
            interest: interestComponent,
            principal: principalComponent,
            outstanding_balance: Number(loan.outstanding_balance),
          },
        });
      }
    }

    // --- Cálculo del seguro de deuda ---
    const totalDebt = loans.reduce(
      (sum, loan) => sum + Number(loan.outstanding_balance),
      0,
    );

    let totalSavings = 0;
    for (const sub of subscriptions) {
      if (!sub.financing_loan_id || sub.financing_loan?.status !== 'active') {
        totalSavings += sub.quantity * Number(sub.stock.value);
      }
    }

    const insuranceBase = totalSavings - totalDebt;
    if (insuranceBase > 0) {
      const insuranceAmount = insuranceBase * 0.001;
      dues.push({
        type: 'insurance',
        description: 'Seguro de deuda',
        amount: insuranceAmount,
      });
    } else {
      dues.push({
        type: 'insurance',
        description: 'Seguro de deuda',
        amount: 0,
      });
    }

    return dues;
  }
}
