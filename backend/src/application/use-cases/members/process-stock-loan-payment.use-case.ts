import { StockLoanPaymentDto } from '@application/dto/members/stock-loan-payment.dto';
import { StockOperationResponseDto } from '@application/dto/members/stock-operation-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { RecordLoanPaymentResponseDto } from '@application/dto/loans/record-loan-payment-response.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { Meeting } from '@domain/entities/meeting.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Process Stock Loan Payment Use Case
 *
 * Orchestrates the payment of a loan using stocks as payment method.
 * The stocks are converted to their monetary value which is then applied to the loan.
 *
 * The operation is split into two parts:
 * 1. STOCK_LOAN_PAYMENT: Converts stocks to virtual cash (STOCK_CAPITAL_ACCOUNT -> CASH_ACCOUNT)
 * 2. LOAN_PAYMENT: Applies the cash to the loan (delegated to RecordLoanPaymentUseCase)
 *
 * This approach maintains separation of responsibilities between the stocks and loans modules.
 */
export class ProcessStockLoanPaymentUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
    private readonly recordLoanPaymentUseCase: RecordLoanPaymentUseCase,
  ) {}

  async execute(dto: StockLoanPaymentDto): Promise<StockOperationResponseDto> {
    // 1. Validate member exists
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new MemberNotFoundException(dto.memberId);
    }

    // 2. Resolve meeting
    const meeting = await this.resolveMeeting(dto.meetingId);
    if (meeting.isClosed()) {
      throw new InvalidRequestError(
        'No se pueden registrar pagos con acciones en una reunión cerrada',
      );
    }

    // 3. Validate subscription
    const subscription = await this.stockSubscriptionRepository.findById(
      dto.subscriptionId,
    );
    if (!subscription || subscription.memberId !== dto.memberId) {
      throw new InvalidRequestError(
        'La suscripción seleccionada no pertenece al socio',
      );
    }

    if (dto.quantity <= 0) {
      throw new InvalidRequestError(
        'La cantidad a aplicar debe ser mayor que cero',
      );
    }

    if (subscription.quantity < dto.quantity) {
      throw new InvalidRequestError(
        'El socio no tiene suficientes acciones en la suscripción indicada',
      );
    }

    // 4. Get stock for value calculation
    const stock = await this.stockRepository.findById(subscription.stockId);
    if (!stock) {
      throw new StockNotFoundException(subscription.stockId);
    }

    // 5. Calculate payment value from stocks
    const paymentValue = stock.value * dto.quantity;

    // 6. Update stock subscription (reduce quantity)
    const updatedQuantity = subscription.quantity - dto.quantity;
    subscription.update({ quantity: updatedQuantity });
    await this.stockSubscriptionRepository.save(subscription);

    // 7. Create the stock conversion operation (STOCK_LOAN_PAYMENT)
    // This represents converting stocks to virtual cash
    const stockConversionEntries: RecordOperationDto['entries'] = [
      {
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: paymentValue,
        description: `Aplicación de ${dto.quantity} ${stock.type} para pagar crédito`,
        stockId: stock.id,
        stockSubscriptionId: subscription.id,
      },
      {
        accountType: CASH_ACCOUNT,
        amount: -paymentValue,
        description: 'Conversión de acciones a efectivo para pago de crédito',
        stockSubscriptionId: subscription.id,
      },
    ];

    const stockOperationResult = await this.recordOperationUseCase.execute({
      memberId: dto.memberId,
      meetingId: meeting.id,
      type: OperationType.STOCK_LOAN_PAYMENT,
      date: meeting.date,
      description:
        dto.notes ??
        `Pago de crédito con ${dto.quantity} acciones ${stock.type}`,
      entries: stockConversionEntries,
    });

    // 8. Apply the payment to the loan using RecordLoanPaymentUseCase
    // This handles all loan-related logic (update loan, create transaction details)
    // The payment is 100% principal since stock payments don't generate interest
    const loanPaymentResult: RecordLoanPaymentResponseDto =
      await this.recordLoanPaymentUseCase.execute({
        loanId: dto.loanId,
        meetingId: meeting.id,
        totalPaymentAmount: paymentValue,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: paymentValue,
        notes: dto.notes ?? 'Pago de capital registrado con acciones del socio',
      });

    // 9. Return response
    return {
      operationId: stockOperationResult.operationId,
      message: 'Pago de crédito con acciones registrado correctamente',
      details: {
        meetingId: meeting.id,
        loanId: loanPaymentResult.loanId,
        stockSubscriptionId: subscription.id,
        quantityUsed: dto.quantity,
        paymentValue,
        loanBalance: loanPaymentResult.newOutstandingBalance,
        loanOperationId: loanPaymentResult.operationId,
        transactionDetailIds: loanPaymentResult.transactionDetailIds,
      },
    };
  }

  private async resolveMeeting(meetingId?: string): Promise<Meeting> {
    if (meetingId) {
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw new MeetingNotFoundException(meetingId);
      }
      return meeting;
    }
    const active = await this.meetingRepository.findActive();
    if (!active) {
      throw new MeetingNotFoundException();
    }
    return active;
  }
}
