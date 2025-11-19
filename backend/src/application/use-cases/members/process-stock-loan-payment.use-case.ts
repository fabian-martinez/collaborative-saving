import { StockLoanPaymentDto } from '@application/dto/members/stock-loan-payment.dto';
import { StockOperationResponseDto } from '@application/dto/members/stock-operation-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { Meeting } from '@domain/entities/meeting.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  LOANS_RECEIVABLE_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '@domain/constants/account-types';

export class ProcessStockLoanPaymentUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: StockLoanPaymentDto): Promise<StockOperationResponseDto> {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new MemberNotFoundException(dto.memberId);
    }

    const meeting = await this.resolveMeeting(dto.meetingId);
    if (meeting.isClosed()) {
      throw new InvalidRequestError(
        'No se pueden registrar pagos con acciones en una reunión cerrada',
      );
    }

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

    const stock = await this.stockRepository.findById(subscription.stockId);
    if (!stock) {
      throw new StockNotFoundException(subscription.stockId);
    }

    const loan = await this.loanRepository.findById(dto.loanId);
    if (!loan) {
      throw new LoanNotFoundException(dto.loanId);
    }
    if (loan.memberId !== dto.memberId) {
      throw new InvalidRequestError(
        'El crédito seleccionado no pertenece al socio',
      );
    }

    const paymentValue = stock.value * dto.quantity;
    const updatedQuantity = subscription.quantity - dto.quantity;
    subscription.update({ quantity: updatedQuantity });
    await this.stockSubscriptionRepository.save(subscription);

    const ledgerEntries: RecordOperationDto['entries'] = [
      {
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: paymentValue,
        description: `Aplicación de ${dto.quantity} ${stock.type} para pagar crédito`,
        stockId: stock.id,
        stockSubscriptionId: subscription.id,
      },
      {
        accountType: LOANS_RECEIVABLE_ACCOUNT,
        amount: -paymentValue,
        description: 'Disminución del saldo del crédito por pago con acciones',
        loanId: loan.id,
      },
    ];

    const operationResult = await this.recordOperationUseCase.execute({
      memberId: dto.memberId,
      meetingId: meeting.id,
      type: OperationType.STOCK_LOAN_PAYMENT,
      date: meeting.date,
      description:
        dto.notes ??
        `Pago de crédito ${loan.loanType} con ${dto.quantity} acciones ${stock.type}`,
      entries: ledgerEntries,
    });

    loan.recordPayment(paymentValue, 0);
    await this.loanRepository.save(loan);

    const transactionDetail = LoanTransactionDetail.create({
      loanId: loan.id,
      transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
      amount: paymentValue,
      notes: dto.notes ?? 'Pago de capital registrado con acciones del socio',
      operationId: operationResult.operationId,
    });
    await this.loanTransactionDetailRepository.save(transactionDetail);

    return {
      operationId: operationResult.operationId,
      message: 'Pago de crédito con acciones registrado correctamente',
      details: {
        meetingId: meeting.id,
        loanId: loan.id,
        stockSubscriptionId: subscription.id,
        quantityUsed: dto.quantity,
        paymentValue,
        loanBalance: loan.outstandingBalance,
        transactionDetailId: transactionDetail.id,
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
