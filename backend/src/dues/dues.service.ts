import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MeetingsService } from '../meetings/meetings.service';
import { MemberDue } from './entities/member-due.entity';
import { MandatoryContributionsService } from '../mandatory-contributions/mandatory-contributions.service';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { LoansService } from '../loans/loans.service';
import { MandatoryContribution } from '../mandatory-contributions/entities/mandatory-contribution.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { MembersService } from '../members/members.service';

@Injectable()
export class DuesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mandatoryContributionsService: MandatoryContributionsService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly loansService: LoansService,
    private readonly membersService: MembersService,
    @Inject(forwardRef(() => MeetingsService))
    private readonly meetingsService: MeetingsService,
  ) {}

  async getMemberDues(memberId: string): Promise<MemberDue[]> {
    const mandatoryContributions =
      await this.mandatoryContributionsService.findAll();
    const activeSubscriptions =
      await this.stockSubscriptionsService.findActiveByMember(memberId);
    const activeLoans = await this.loansService.findActiveByMember(memberId);

    const mandatoryDues = this.calculateMandatoryContributionDues(
      mandatoryContributions,
    );
    const stockDues = this.calculateStockFeeDues(activeSubscriptions);
    const loanDues = this.calculateLoanPaymentDues(activeLoans);

    return [...mandatoryDues, ...stockDues, ...loanDues];
  }

  async getMemberDuesForActiveMeeting(memberId: string): Promise<MemberDue[]> {
    const activeMeeting = await this.meetingsService.findActive();
    if (!activeMeeting) {
      throw new NotFoundException('No active meeting found.');
    }

    const member = await this.membersService.findOne(memberId);
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found.`);
    }

    const mandatoryContributions =
      await this.mandatoryContributionsService.findAll();
    const subscriptions = await this.dataSource.manager.find(
      StockSubscription,
      {
        where: { member_id: memberId },
        relations: ['stock', 'financing_loan'],
      },
    );
    const activeLoans = await this.loansService.findActiveByMember(memberId);

    const mandatoryDues = this.calculateMandatoryContributionDues(
      mandatoryContributions,
    );
    const stockDues = this.calculateStockFeeDues(subscriptions);

    const unpaidLoans = activeLoans.filter(
      (loan) => loan.payment_status_this_month !== 'PAID',
    );
    const loanDues = this.calculateLoanPaymentDues(unpaidLoans);

    return [...mandatoryDues, ...stockDues, ...loanDues];
  }

  private calculateMandatoryContributionDues(
    contributions: MandatoryContribution[],
  ): MemberDue[] {
    return contributions
      .filter((contribution) => contribution.value > 0)
      .map((contribution) => ({
        type: 'mandatory_contribution',
        description: contribution.asset_type,
        amount: Number(contribution.value),
        referenceId: contribution.id,
      }));
  }

  private calculateStockFeeDues(
    subscriptions: StockSubscription[],
  ): MemberDue[] {
    return subscriptions
      .filter((sub) => sub.stock && Number(sub.stock.monthly_contribution) > 0)
      .map((sub) => ({
        type: 'stock_fee',
        description: `Cuota de acción: ${sub.stock.type}`,
        amount: sub.quantity * Number(sub.stock.monthly_contribution),
        referenceId: sub.stock.id,
        monthlyContribution: Number(sub.stock.monthly_contribution),
        stockQuantity: sub.quantity,
      }));
  }

  private calculateLoanPaymentDues(loans: Loan[]): MemberDue[] {
    return loans
      .filter((loan) => loan.outstanding_balance > 0)
      .map((loan) => {
        const principalComponent = Number(loan.monthly_payment_amount);
        const interestComponent =
          Number(loan.outstanding_balance) * Number(loan.interest_rate);

        return {
          type: 'loan_payment',
          description: `Cuota préstamo: ${loan.loan_type}`,
          amount: principalComponent + interestComponent,
          referenceId: loan.id,
          details: {
            interest: interestComponent,
            principal: principalComponent,
            outstanding_balance: Number(loan.outstanding_balance),
          },
        };
      });
  }

  async calculateInsurance(
    memberId: string,
    capitalPayment = 0,
  ): Promise<{ insuranceAmount: number }> {
    const subscriptions = await this.dataSource.manager.find(
      StockSubscription,
      {
        where: { member_id: memberId },
        relations: ['stock', 'financing_loan'],
      },
    );

    const loans = await this.loansService.findActiveByMember(memberId);

    const financingLoanIds = new Set(
      subscriptions
        .filter(
          (sub) =>
            sub.financing_loan_id && sub.financing_loan?.status === 'active',
        )
        .map((sub) => sub.financing_loan_id),
    );

    const totalDebt = loans
      .filter((loan) => !financingLoanIds.has(loan.id))
      .reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);

    const totalSavings = subscriptions.reduce((sum, sub) => {
      if (!sub.financing_loan_id || sub.financing_loan?.status !== 'active') {
        return sum + sub.quantity * Number(sub.stock.value);
      }
      return sum;
    }, 0);

    const adjustedDebt = totalDebt - capitalPayment;
    const insuranceBase = adjustedDebt - totalSavings;
    const insuranceAmount = insuranceBase > 0 ? insuranceBase * 0.001 : 0;

    return { insuranceAmount };
  }
}
