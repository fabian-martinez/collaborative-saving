import { StockExchangeDto } from '@application/dto/members/stock-exchange.dto';
import { StockOperationResponseDto } from '@application/dto/members/stock-operation-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { RecordLoanPaymentResponseDto } from '@application/dto/loans/record-loan-payment-response.dto';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { Meeting } from '@domain/entities/meeting.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';

const DEFAULT_DIFFERENCE_LOAN_INTEREST = 0.02;
const DEFAULT_DIFFERENCE_LOAN_TERM = 24;

interface LoanDetails {
  loanId: string;
  amount?: number;
  operationId?: string;
  principalPaid?: number;
  newBalance?: number;
  loanType?: string;
}

/**
 * Process Stock Exchange Use Case
 *
 * Orchestrates the exchange of stocks between different types for a member.
 * Handles the difference between stock values through cash or credit.
 *
 * Loan creation and payments are delegated to the loans module:
 * - CreateLoanUseCase for new loans when financing the difference
 * - RecordLoanPaymentUseCase for payments to existing loans
 */
export class ProcessStockExchangeUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly recordLoanPaymentUseCase: RecordLoanPaymentUseCase,
    private readonly transactionManager: TransactionManager,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
  ) {}

  async execute(dto: StockExchangeDto): Promise<StockOperationResponseDto> {
    return this.transactionManager.execute(async () => {
      const member = await this.memberRepository.findById(dto.memberId);
      if (!member) {
        throw new MemberNotFoundException(dto.memberId);
      }

      const meeting = await this.resolveMeeting(dto.meetingId);
      if (meeting.isClosed()) {
        throw new InvalidRequestError(
          'No se pueden modificar acciones en una reunión cerrada',
        );
      }

      const fromSubscription = await this.stockSubscriptionRepository.findById(
        dto.fromSubscriptionId,
      );
      if (!fromSubscription || fromSubscription.memberId !== dto.memberId) {
        throw new InvalidRequestError(
          'La suscripción de origen no pertenece al socio',
        );
      }

      if (dto.fromQuantity <= 0) {
        throw new InvalidRequestError(
          'La cantidad origen debe ser mayor que cero',
        );
      }

      if (fromSubscription.quantity < dto.fromQuantity) {
        throw new InvalidRequestError(
          'El socio no tiene acciones suficientes en la suscripción origen',
        );
      }

      if (dto.toQuantity <= 0) {
        throw new InvalidRequestError(
          'La cantidad destino debe ser mayor que cero',
        );
      }

      const fromStock = await this.stockRepository.findById(
        fromSubscription.stockId,
      );
      if (!fromStock) {
        throw new StockNotFoundException(fromSubscription.stockId);
      }

      const toStock = await this.stockRepository.findById(dto.toStockId);
      if (!toStock) {
        throw new StockNotFoundException(dto.toStockId);
      }

      const { subscription: destinationSubscription, isNew } =
        await this.getOrCreateDestinationSubscription(
          dto.memberId,
          dto.toStockId,
          dto.toQuantity,
          meeting,
        );

      const fromValue = fromStock.value * dto.fromQuantity;
      const toValue = toStock.value * dto.toQuantity;
      const difference = fromValue - toValue;

      const updatedFromQuantity = fromSubscription.quantity - dto.fromQuantity;
      fromSubscription.update({ quantity: updatedFromQuantity });
      if (isNew) {
        // el helper ya creó la suscripción con la cantidad solicitada
      } else {
        destinationSubscription.update({
          quantity: destinationSubscription.quantity + dto.toQuantity,
        });
      }

      await this.stockSubscriptionRepository.save(fromSubscription);
      await this.stockSubscriptionRepository.save(destinationSubscription);

      // Build ledger entries for the stock exchange operation
      const ledgerEntries: RecordOperationDto['entries'] = [
        {
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: fromValue,
          description: `Reducción de ${dto.fromQuantity} acciones ${fromStock.type}`,
          stockId: fromStock.id,
          stockSubscriptionId: fromSubscription.id,
        },
        {
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: -toValue,
          description: `Creación de ${dto.toQuantity} acciones ${toStock.type}`,
          stockId: toStock.id,
          stockSubscriptionId: destinationSubscription.id,
        },
      ];

      const details: Record<string, unknown> = {
        memberId: dto.memberId,
        meetingId: meeting.id,
        fromSubscriptionId: fromSubscription.id,
        toSubscriptionId: destinationSubscription.id,
        fromValue,
        toValue,
        difference,
        differenceHandling: dto.differenceHandling ?? 'cash',
      };

      // Handle the difference
      if (difference !== 0) {
        const handling = dto.differenceHandling ?? 'cash';
        if (handling === 'credit') {
          await this.handleDifferenceWithCredit({
            dto,
            difference,
            ledgerEntries,
            details,
            meeting,
          });
        } else {
          await this.handleDifferenceWithCash({
            difference,
            ledgerEntries,
            details,
            meeting,
            memberId: dto.memberId,
            stockSubscriptionId: fromSubscription.id,
            notes: dto.notes,
          });
        }
      }

      // Create the main stock modification operation
      const operationDto: RecordOperationDto = {
        memberId: dto.memberId,
        meetingId: meeting.id,
        type: OperationType.STOCK_MODIFICATION,
        date: meeting.date,
        description:
          dto.notes ??
          `Intercambio de ${dto.fromQuantity} ${fromStock.type} a ${dto.toQuantity} ${toStock.type}`,
        entries: ledgerEntries,
      };

      const operationResult =
        await this.recordOperationUseCase.execute(operationDto);

      // If a new loan was created (and accounting skipped), record the transaction detail now
      // knowing the operation ID
      const loanDetails = details.loan as LoanDetails | undefined;
      if (
        loanDetails &&
        loanDetails.loanId &&
        loanDetails.amount &&
        !loanDetails.operationId
      ) {
        const transactionDetail = LoanTransactionDetail.create({
          loanId: loanDetails.loanId,
          transactionType: LoanTransactionType.DISBURSEMENT,
          amount: loanDetails.amount,
          operationId: operationResult.operationId,
        });
        await this.loanTransactionDetailRepository.save(transactionDetail);

        // Update details with operationId
        loanDetails.operationId = operationResult.operationId;
      }

      return {
        operationId: operationResult.operationId,
        message: 'Intercambio de acciones procesado correctamente',
        details,
      };
    });
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

  private async getOrCreateDestinationSubscription(
    memberId: string,
    stockId: string,
    quantity: number,
    meeting: Meeting,
  ): Promise<{ subscription: StockSubscription; isNew: boolean }> {
    const existing =
      await this.stockSubscriptionRepository.findByMemberAndStock(
        memberId,
        stockId,
      );
    if (existing) {
      return { subscription: existing, isNew: false };
    }
    const created = StockSubscription.create({
      memberId,
      stockId,
      quantity,
      purchaseDate: meeting.date,
    });
    return { subscription: created, isNew: true };
  }

  /**
   * Handle difference with credit (loan creation or loan payment)
   * Delegates to loans module use cases
   */
  private async handleDifferenceWithCredit(params: {
    dto: StockExchangeDto;
    difference: number;
    ledgerEntries: RecordOperationDto['entries'];
    details: Record<string, unknown>;
    meeting: Meeting;
  }): Promise<void> {
    const { dto, difference, ledgerEntries, details, meeting } = params;

    if (!dto.targetLoanId) {
      throw new InvalidRequestError(
        'targetLoanId es requerido cuando differenceHandling es credit',
      );
    }

    if (difference > 0) {
      // Member has value to apply to an existing loan
      await this.handleLoanPayment({
        dto,
        difference,
        ledgerEntries,
        details,
        meeting,
      });
    } else {
      // Member needs financing - create a new loan
      await this.handleLoanCreation({
        dto,
        absoluteDifference: Math.abs(difference),
        ledgerEntries,
        details,
        meeting,
      });
    }
  }

  /**
   * Handle payment to an existing loan using RecordLoanPaymentUseCase
   */
  private async handleLoanPayment(params: {
    dto: StockExchangeDto;
    difference: number;
    ledgerEntries: RecordOperationDto['entries'];
    details: Record<string, unknown>;
    meeting: Meeting;
  }): Promise<void> {
    const { dto, difference, ledgerEntries, details, meeting } = params;

    if (
      dto.targetLoanId === 'new_action_loan' ||
      dto.targetLoanId === 'new_current_loan'
    ) {
      throw new InvalidRequestError(
        'Para abonos a crédito existente se debe enviar un ID de crédito válido',
      );
    }

    // Use RecordLoanPaymentUseCase with all payment going to principal
    const paymentResult: RecordLoanPaymentResponseDto =
      await this.recordLoanPaymentUseCase.execute({
        loanId: dto.targetLoanId!,
        meetingId: meeting.id,
        totalPaymentAmount: difference,
        forcedInterestAmount: 0,
        forcedPrincipalAmount: difference,
        notes:
          dto.notes ??
          'Abono automático por diferencia de intercambio de acciones',
      });

    // Add the balancing entry to the stock modification operation
    // Note: The actual loan update is handled by RecordLoanPaymentUseCase in a separate operation
    ledgerEntries.push({
      accountType: CASH_ACCOUNT,
      amount: -difference,
      description: 'Diferencia aplicada a crédito existente',
    });

    details.loan = {
      loanId: paymentResult.loanId,
      operationId: paymentResult.operationId,
      principalPaid: paymentResult.principalPaid,
      newBalance: paymentResult.newOutstandingBalance,
    };
  }

  /**
   * Handle creation of a new loan using CreateLoanUseCase
   */
  private async handleLoanCreation(params: {
    dto: StockExchangeDto;
    absoluteDifference: number;
    ledgerEntries: RecordOperationDto['entries'];
    details: Record<string, unknown>;
    meeting: Meeting;
  }): Promise<void> {
    const { dto, absoluteDifference, ledgerEntries, details, meeting } = params;

    let loanType: 'corriente' | 'agil' | 'accion';
    if (dto.targetLoanId === 'new_action_loan') {
      loanType = 'accion';
    } else if (dto.targetLoanId === 'new_current_loan') {
      loanType = 'corriente';
    } else {
      throw new InvalidRequestError(
        'Para financiar la diferencia debes usar new_action_loan o new_current_loan',
      );
    }

    // Use CreateLoanUseCase to create the loan WITHOUT accounting
    // We will merge the accounting into the stock exchange operation to avoid cash movements
    const loanResult = await this.createLoanUseCase.execute({
      memberId: dto.memberId,
      meetingId: meeting.id,
      loanType,
      approvedAmount: absoluteDifference,
      disbursedAmount: absoluteDifference,
      monthlyPaymentAmount: 0,
      interestRate: DEFAULT_DIFFERENCE_LOAN_INTEREST,
      term: DEFAULT_DIFFERENCE_LOAN_TERM,
      skipAccounting: true,
    });

    // Add the balancing entry to the stock modification operation
    // Replaces Cash movement with direct Loan Receivable
    ledgerEntries.push({
      accountType: LOANS_RECEIVABLE_ACCOUNT,
      amount: absoluteDifference,
      description: 'Financiamiento de diferencia por intercambio de acciones',
      loanId: loanResult.loanId,
    });

    details.loan = {
      loanId: loanResult.loanId,
      operationId: '', // Will be linked to the main operation later
      loanType,
      amount: absoluteDifference, // Capture amount for transaction detail creation
    };
  }

  /**
   * Handle difference with cash
   */
  private async handleDifferenceWithCash(params: {
    difference: number;
    ledgerEntries: RecordOperationDto['entries'];
    details: Record<string, unknown>;
    meeting: Meeting;
    memberId: string;
    stockSubscriptionId: string;
    notes?: string;
  }): Promise<void> {
    const {
      difference,
      ledgerEntries,
      details,
      meeting,
      memberId,
      stockSubscriptionId,
      notes,
    } = params;

    const absoluteDifference = Math.abs(difference);
    if (difference > 0) {
      // Member has value to receive
      ledgerEntries.push({
        accountType: CASH_ACCOUNT,
        amount: -absoluteDifference,
        description: 'Diferencia a favor del socio',
        stockSubscriptionId,
      });

      // Create pending payment for the member
      const pending = PendingMemberPayment.create({
        memberId,
        meetingId: meeting.id,
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: absoluteDifference,
        notes: notes ?? 'Pendiente a favor por intercambio de acciones',
        stockSubscriptionId,
      });
      const saved = await this.pendingMemberPaymentRepository.save(pending);
      details.pendingPaymentId = saved.id;
    } else {
      // Member needs to pay
      ledgerEntries.push({
        accountType: CASH_ACCOUNT,
        amount: absoluteDifference,
        description:
          'Pago en efectivo de diferencia por intercambio de acciones',
        stockSubscriptionId,
      });
    }
  }
}
