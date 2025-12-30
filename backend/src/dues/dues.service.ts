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
import { Stock } from '../stocks/entities/stock.entity';
import { Operation } from '../operations/entities/operation.entity';
import { LoanTransactionDetail } from '../loans/entities/loan-transaction-detail.entity';
import { TransactionType } from '../domain/enums/transaction-type.enum';
import { PaymentType } from '../domain/enums/payment-type.enum';

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

    // 1. Obtener todas las contribuciones obligatorias
    const mandatoryContributions =
      await this.mandatoryContributionsService.findAll();
    // 2. Obtener suscripciones activas del socio
    const subscriptions =
      await this.stockSubscriptionsService.findActiveByMember(memberId);
    // Agrupar suscripciones activas por stock_id
    const groupedSubs: Record<string, { stock: Stock; quantity: number }> = {};
    for (const sub of subscriptions) {
      if (!groupedSubs[sub.stock_id]) {
        groupedSubs[sub.stock_id] = { stock: sub.stock, quantity: 0 };
      }
      groupedSubs[sub.stock_id].quantity += Number(sub.quantity);
    }
    // 3. Calcular la cuota obligatoria como monto fijo por contribución
    const mandatoryDues: MemberDue[] = mandatoryContributions
      .filter((contribution) => contribution.value > 0)
      .map((contribution) => ({
        type: PaymentType.MANDATORY_CONTRIBUTION,
        description: contribution.asset_type,
        amount: Number(contribution.value),
        referenceId: contribution.id,
      }));
    // 4. Cuotas de acciones y préstamos (sin cambios)
    const stockDues = this.calculateStockFeeDues(subscriptions);
    const activeLoans = await this.loansService.findActiveByMember(memberId);
    // buscar los prestamos son transacciones en la reunion actual
    // Obtener todas las loan transactions de la reunion actual que sean de tipo pago de interes
    // Validar si los prestamos activos tienen transacciones de pago de interes en la reunion actual
    const unpaidLoans: Loan[] = [];
    for (const loan of activeLoans) {
      const hasInterestPayment = await this.dataSource.manager
        .createQueryBuilder(LoanTransactionDetail, 'ltd')
        .innerJoin(Operation, 'op', 'ltd.operation_id = op.id')
        .where('ltd.loan_id = :loanId', { loanId: loan.id })
        .andWhere('ltd.transaction_type = :transactionType', {
          transactionType: TransactionType.INTEREST_PAYMENT,
        })
        .andWhere('op.meeting_id = :meetingId', { meetingId: activeMeeting.id })
        .getExists();
      if (!hasInterestPayment) {
        unpaidLoans.push(loan);
      }
    }
    const loanDues = this.calculateLoanPaymentDues(unpaidLoans);
    return [...mandatoryDues, ...stockDues, ...loanDues];
  }

  private calculateMandatoryContributionDues(
    contributions: MandatoryContribution[],
  ): MemberDue[] {
    return contributions
      .filter((contribution) => contribution.value > 0)
      .map((contribution) => ({
        type: PaymentType.MANDATORY_CONTRIBUTION,
        description: contribution.asset_type,
        amount: Number(contribution.value),
        referenceId: contribution.id,
      }));
  }

  private calculateStockFeeDues(
    subscriptions: StockSubscription[],
  ): MemberDue[] {
    // Agrupar subscripciones por stock.id
    const grouped = subscriptions.reduce(
      (acc, sub) => {
        if (sub.stock) {
          const stockId = sub.stock.id;
          if (!acc[stockId]) {
            acc[stockId] = {
              stock: sub.stock,
              quantity: 0,
              monthlyContribution: Number(sub.stock.monthly_contribution),
            };
          }
          acc[stockId].quantity =
            Number(acc[stockId].quantity) + Number(sub.quantity);
        }
        return acc;
      },
      {} as Record<
        string,
        { stock: Stock; quantity: number; monthlyContribution: number }
      >,
    );

    return Object.values(grouped)
      .filter((group) => group.quantity > 0)
      .map((group) => ({
        type: PaymentType.STOCK_FEE,
        description: `Cuota de acción: ${group.stock.type}`,
        amount: group.quantity * group.monthlyContribution,
        referenceId: group.stock.id,
        monthlyContribution: group.monthlyContribution,
        stockQuantity: Number(group.quantity),
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
          type: PaymentType.LOAN_PAYMENT,
          description: `Cuota préstamo: ${loan.loan_type}`,
          amount: principalComponent + interestComponent,
          referenceId: loan.id,
          creationDate: loan.creation_date,
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
