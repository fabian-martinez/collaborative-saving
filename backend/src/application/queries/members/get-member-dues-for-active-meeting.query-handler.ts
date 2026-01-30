import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MandatoryContributionRepository } from '@domain/ports/repositories/mandatory-contribution-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { Loan } from '@domain/entities/loan.entity';
import { MemberDueResponseDto } from '@application/dto/members/member-due-response.dto';
import { LoanTransactionType } from '@domain/entities/loan-transaction-detail.entity';
import { PaymentType } from '@domain/enums/payment-type.enum';

export class GetMemberDuesForActiveMeetingQueryHandler {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly memberRepository: MemberRepository,
    private readonly mandatoryContributionRepository: MandatoryContributionRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly stockRepository: StockRepository,
  ) {}

  async execute(memberId: string): Promise<MemberDueResponseDto[]> {
    // 1. Obtener reunión activa (opcional)
    const activeMeeting = await this.meetingRepository.findActive();

    // 2. Validar que el miembro existe
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundException(memberId);
    }

    // 3. Obtener contribuciones obligatorias
    const mandatoryContributions =
      await this.mandatoryContributionRepository.findAll();

    // 4. Obtener suscripciones activas del miembro
    const activeSubscriptions =
      await this.stockSubscriptionRepository.findActiveByMember(memberId);

    // 5. Obtener préstamos activos del miembro
    const activeLoans = await this.loanRepository.findActiveByMember(memberId);

    // 6. Calcular obligaciones mandatorias
    const mandatoryDues = this.calculateMandatoryContributionDues(
      mandatoryContributions,
    );

    // 7. Calcular obligaciones de acciones
    const stockDues = await this.calculateStockFeeDues(activeSubscriptions);

    // 8. Filtrar préstamos sin pago de interés en la reunión activa (si existe) y calcular obligaciones
    // Si no hay reunión activa, se retornan todos los préstamos activos sin filtrar
    const unpaidLoans = await this.filterUnpaidLoans(
      activeLoans,
      activeMeeting?.id,
    );
    const loanDues = this.calculateLoanPaymentDues(unpaidLoans);

    return [...mandatoryDues, ...stockDues, ...loanDues];
  }

  private calculateMandatoryContributionDues(
    contributions: Array<{ id: string; assetType: string; value: number }>,
  ): MemberDueResponseDto[] {
    return contributions.map((contribution) => ({
      type: PaymentType.MANDATORY_CONTRIBUTION,
      description: contribution.assetType,
      amount: contribution.value,
      referenceId: contribution.id,
    }));
  }

  private async calculateStockFeeDues(
    subscriptions: Array<{ stockId: string; quantity: number }>,
  ): Promise<MemberDueResponseDto[]> {
    // Agrupar suscripciones por stockId
    const groupedByStock = subscriptions.reduce(
      (acc, sub) => {
        if (!acc[sub.stockId]) {
          acc[sub.stockId] = 0;
        }
        acc[sub.stockId] += sub.quantity;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Obtener información de stocks para cada grupo
    const stockDues: MemberDueResponseDto[] = [];
    for (const [stockId, totalQuantity] of Object.entries(groupedByStock)) {
      if (totalQuantity > 0) {
        const stock = await this.stockRepository.findById(stockId);
        if (stock && stock.monthlyContribution > 0) {
          stockDues.push({
            type: PaymentType.STOCK_FEE,
            description: `Cuota de acción: ${stock.name}`,
            amount: totalQuantity * stock.monthlyContribution,
            referenceId: stock.id,
            monthlyContribution: stock.monthlyContribution,
            stockQuantity: totalQuantity,
          });
        }
      }
    }

    return stockDues;
  }

  private async filterUnpaidLoans(
    activeLoans: Loan[],
    meetingId?: string,
  ): Promise<Loan[]> {
    // Si no hay meetingId, retornar todos los préstamos activos sin filtrar
    if (!meetingId) {
      return activeLoans;
    }

    const unpaidLoans: Loan[] = [];

    for (const loan of activeLoans) {
      // Obtener todas las transacciones del préstamo en la reunión activa
      const transactions =
        await this.loanTransactionDetailRepository.findByLoanAndMeeting(
          loan.id,
          meetingId,
        );

      // Verificar si hay algún pago de interés en estas transacciones
      const hasInterestPayment = transactions.some(
        (transaction) =>
          transaction.transactionType ===
          String(LoanTransactionType.INTEREST_PAYMENT),
      );

      // Si no hay pago de interés, agregar a la lista de préstamos sin pagar
      if (!hasInterestPayment) {
        unpaidLoans.push(loan);
      }
    }

    return unpaidLoans;
  }

  private calculateLoanPaymentDues(loans: Loan[]): MemberDueResponseDto[] {
    return loans
      .filter((loan) => loan.outstandingBalance > 0)
      .map((loan) => {
        const principalComponent = loan.monthlyPaymentAmount;
        const interestComponent = loan.outstandingBalance * loan.interestRate;

        return {
          type: PaymentType.LOAN_PAYMENT,
          description: `Cuota préstamo: ${loan.loanType}`,
          amount: principalComponent + interestComponent,
          referenceId: loan.id,
          creationDate: loan.creationDate.toISOString().split('T')[0],
          details: {
            interest: interestComponent,
            principal: principalComponent,
            outstanding_balance: loan.outstandingBalance,
          },
        };
      });
  }
}
