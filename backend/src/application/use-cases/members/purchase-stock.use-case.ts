import { PurchaseStockDto } from '@application/dto/members/purchase-stock.dto';
import { PurchaseStockResponseDto } from '@application/dto/members/purchase-stock-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { CreateLoanDto } from '@application/dto/loans/create-loan.dto';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Meeting } from '@domain/entities/meeting.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import {
  STOCK_CAPITAL_ACCOUNT,
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Purchase Stock Use Case
 *
 * Orchestrates the purchase of stocks by a member.
 * Handles cash payments, loan financing, and creates the necessary accounting entries.
 */
export class PurchaseStockUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: PurchaseStockDto): Promise<PurchaseStockResponseDto> {
    // 1. Validate member exists
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new MemberNotFoundException(dto.memberId);
    }

    // 2. Get active meeting (or use provided meetingId)
    let meeting: Meeting | null;
    if (dto.meetingId) {
      meeting = await this.meetingRepository.findById(dto.meetingId);
      if (!meeting) {
        throw new MeetingNotFoundException(dto.meetingId);
      }
    } else {
      meeting = await this.meetingRepository.findActive();
      if (!meeting) {
        throw new MeetingNotFoundException();
      }
    }

    // At this point, meeting is guaranteed to be non-null
    const activeMeeting = meeting;

    if (activeMeeting.isClosed()) {
      throw new InvalidRequestError(
        'Cannot purchase stocks in a closed meeting',
      );
    }

    // 3. Validate stock exists
    const stock = await this.stockRepository.findById(dto.stockId);
    if (!stock) {
      throw new StockNotFoundException(dto.stockId);
    }

    // 4. Validate input data
    if (dto.quantity <= 0) {
      throw new InvalidRequestError('Quantity must be greater than zero');
    }
    if (dto.cashAmount < 0) {
      throw new InvalidRequestError('Cash amount cannot be negative');
    }

    // 5. Calculate total value and financed amount
    const totalValue = stock.value * dto.quantity;
    const financedAmount = totalValue - dto.cashAmount;

    // Validate that cashAmount doesn't exceed totalValue
    if (dto.cashAmount > totalValue) {
      throw new InvalidRequestError('Cash amount cannot exceed total value');
    }

    // 6. Create loan if financing is needed
    let loanId: string | null = null;
    if (financedAmount > 0) {
      if (!dto.loanDetails) {
        throw new InvalidRequestError(
          'Loan details are required when financed amount is greater than zero',
        );
      }

      // Validate loan details
      if (dto.loanDetails.loan_type !== 'accion') {
        throw new InvalidRequestError(
          'Only "accion" loan type is allowed for stock purchases',
        );
      }
      if (dto.loanDetails.interest_rate <= 0) {
        throw new InvalidRequestError(
          'Interest rate must be greater than zero',
        );
      }

      // Create loan using CreateLoanUseCase
      const createLoanDto: CreateLoanDto = {
        memberId: dto.memberId,
        meetingId: activeMeeting.id,
        loanType: 'accion',
        approvedAmount: financedAmount,
        monthlyPaymentAmount: 0,
        interestRate: dto.loanDetails.interest_rate,
        term: 24, // Default term for stock purchase loans
      };

      const loanResult = await this.createLoanUseCase.execute(createLoanDto);
      loanId = loanResult.loanId;
    }

    // 7. Create StockSubscription
    const stockSubscription = StockSubscription.create({
      memberId: dto.memberId,
      stockId: dto.stockId,
      quantity: dto.quantity,
      purchaseDate: activeMeeting.date,
      financingLoanId: loanId,
    });

    const savedStockSubscription =
      await this.stockSubscriptionRepository.save(stockSubscription);

    // 8. Create accounting operation using RecordOperationUseCase
    const operationDescription = `Compra de ${dto.quantity} acciones de ${stock.type}`;

    const ledgerEntries: RecordOperationDto['entries'] = [];

    // STOCK_CAPITAL_ACCOUNT (credit, -totalValue) - capital increases
    ledgerEntries.push({
      accountType: STOCK_CAPITAL_ACCOUNT,
      amount: -totalValue,
      description: operationDescription,
      stockId: dto.stockId,
      stockSubscriptionId: savedStockSubscription.id,
    });

    // CASH_ACCOUNT (debit, +cashAmount) - cash received if any
    if (dto.cashAmount > 0) {
      ledgerEntries.push({
        accountType: CASH_ACCOUNT,
        amount: dto.cashAmount,
        description: operationDescription,
      });
    }

    // LOANS_RECEIVABLE_ACCOUNT (debit, +financedAmount) - loan receivable if financed
    if (financedAmount > 0 && loanId) {
      ledgerEntries.push({
        accountType: LOANS_RECEIVABLE_ACCOUNT,
        amount: financedAmount,
        description: operationDescription,
        loanId: loanId,
      });
    }

    const operationDto: RecordOperationDto = {
      memberId: dto.memberId,
      meetingId: activeMeeting.id,
      type: OperationType.STOCK_PURCHASE,
      description: operationDescription,
      date: activeMeeting.date,
      entries: ledgerEntries,
    };

    const operationResult =
      await this.recordOperationUseCase.execute(operationDto);

    // 9. Return response
    return {
      operationId: operationResult.operationId,
      meetingId: activeMeeting.id,
      memberId: dto.memberId,
      stockSubscriptionId: savedStockSubscription.id,
      loanId: loanId || null,
    };
  }
}
