import { MemberDue } from '../../dues/entities/member-due.entity';
import { MandatoryContributionRepository } from '../ports/repositories/mandatory-contribution-repository.port';
import { StockSubscriptionRepository } from '../ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '../ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '../ports/repositories/loan-transaction-detail-repository.port';
import { MeetingRepository } from '../ports/repositories/meeting-repository.port';
import { TransactionType } from '../../common/enums/transaction-type.enum';
// Importaciones de entidades TypeORM necesarias para c?lculo de cuotas
import { Loan } from '../../loans/entities/loan.entity';
import { StockSubscription } from '../../stock-subscriptions/entities/stock-subscription.entity';
import { Stock } from '../../stocks/entities/stock.entity';

export class DuesCalculationService {
  constructor(
    private readonly mandatoryContributionRepository: MandatoryContributionRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly meetingRepository: MeetingRepository,
  ) {}

  /**
   * Calcula las cuotas pendientes de un miembro para la reuni?n activa
   */
  async calculateMemberDuesForActiveMeeting(
    memberId: string,
  ): Promise<MemberDue[]> {
    // Obtener reuni?n activa
    const activeMeeting = await this.meetingRepository.findActive();
    if (!activeMeeting) {
      throw new Error('No active meeting found');
    }

    // 1. Obtener todas las contribuciones obligatorias
    const mandatoryContributions =
      await this.mandatoryContributionRepository.findAll();

    // 2. Obtener suscripciones activas del socio
    const subscriptions =
      await this.stockSubscriptionRepository.findActiveByMember(memberId);

    // 3. Calcular la cuota obligatoria como monto fijo por contribuci?n
    const mandatoryDues = this.calculateMandatoryContributionDues(
      mandatoryContributions,
    );

    // 4. Calcular cuotas de acciones
    const stockDues = this.calculateStockFeeDues(subscriptions);

    // 5. Obtener pr?stamos activos
    const activeLoans = await this.loanRepository.findActiveByMember(memberId);

    // 6. Filtrar pr?stamos que no han sido pagados en la reuni?n actual
    const unpaidLoans: Loan[] = [];
    for (const loan of activeLoans) {
      const hasInterestPayment =
        await this.loanTransactionDetailRepository.findByLoanAndTransactionType(
          loan.id,
          TransactionType.INTEREST_PAYMENT,
          activeMeeting.id,
        );
      if (!hasInterestPayment) {
        unpaidLoans.push(loan);
      }
    }

    // 7. Calcular cuotas de pr?stamos
    const loanDues = this.calculateLoanPaymentDues(unpaidLoans);

    return [...mandatoryDues, ...stockDues, ...loanDues];
  }

  private calculateMandatoryContributionDues(
    contributions: any[],
  ): MemberDue[] {
    return contributions
      .filter((contribution) => contribution.value > 0)
      .map((contribution) => ({
        type: 'mandatory_contribution' as const,
        description: contribution.assetType,
        amount: Number(contribution.value),
        referenceId: contribution.id,
      }));
  }

  private calculateStockFeeDues(
    subscriptions: StockSubscription[],
  ): MemberDue[] {
    // Agrupar subscripciones por stock.id
    const grouped: Record<
      string,
      { stock: Stock; quantity: number; monthlyContribution: number }
    > = {};

    for (const sub of subscriptions) {
      if (sub.stock) {
        const stockId = sub.stock.id;
        if (!grouped[stockId]) {
          grouped[stockId] = {
            stock: sub.stock,
            quantity: 0,
            monthlyContribution: Number(sub.stock.monthly_contribution),
          };
        }
        grouped[stockId].quantity =
          Number(grouped[stockId].quantity) + Number(sub.quantity);
      }
    }

    return Object.values(grouped)
      .filter((group) => group.quantity > 0)
      .map((group) => ({
        type: 'stock_fee' as const,
        description: `Cuota de acci?n: ${group.stock.type}`,
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
          type: 'loan_payment' as const,
          description: `Cuota pr?stamo: ${loan.loan_type}`,
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
}
