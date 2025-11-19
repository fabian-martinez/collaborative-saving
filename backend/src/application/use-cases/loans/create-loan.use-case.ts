import { CreateLoanDto } from '@application/dto/loans/create-loan.dto';
import { CreateLoanResponseDto } from '@application/dto/loans/create-loan-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import {
  LOANS_RECEIVABLE_ACCOUNT,
  CASH_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
} from '@domain/constants/account-types';

/**
 * Create Loan Use Case
 *
 * Orchestrates the creation of a loan with disbursement.
 * Creates the loan entity, accounting operation, transaction details,
 * and pending payment if disbursement is partial.
 */
export class CreateLoanUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: CreateLoanDto): Promise<CreateLoanResponseDto> {
    // 1. Validate member exists
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new MemberNotFoundException(dto.memberId);
    }

    // 2. Validate meeting exists and is active
    const meeting = await this.meetingRepository.findById(dto.meetingId);
    if (!meeting) {
      throw new MeetingNotFoundException(dto.meetingId);
    }
    if (meeting.isClosed()) {
      throw new InvalidRequestError('Cannot create loan for a closed meeting');
    }

    // 3. Validate loan data
    if (dto.approvedAmount <= 0) {
      throw new InvalidRequestError(
        'Approved amount must be greater than zero',
      );
    }
    if (dto.interestRate <= 0) {
      throw new InvalidRequestError('Interest rate must be greater than zero');
    }
    if (dto.monthlyPaymentAmount < 0) {
      throw new InvalidRequestError(
        'Monthly payment amount cannot be negative',
      );
    }
    if (dto.term <= 0) {
      throw new InvalidRequestError('Term must be greater than zero');
    }

    // 4. Set defaults for disbursedAmount and outstandingBalance
    const disbursedAmount = dto.disbursedAmount ?? dto.approvedAmount;
    const outstandingBalance = dto.outstandingBalance ?? dto.approvedAmount;

    // Validate disbursedAmount
    if (disbursedAmount < 0) {
      throw new InvalidRequestError('Disbursed amount cannot be negative');
    }
    if (disbursedAmount > dto.approvedAmount) {
      throw new InvalidRequestError(
        'Disbursed amount cannot exceed approved amount',
      );
    }

    // 5. Create Loan entity
    const loan = Loan.create({
      memberId: dto.memberId,
      loanType: dto.loanType,
      approvedAmount: dto.approvedAmount,
      monthlyPaymentAmount: dto.monthlyPaymentAmount,
      interestRate: dto.interestRate,
      term: dto.term,
      guaranteedStockId: dto.guaranteedStockId,
    });

    // Update loan with disbursement information
    loan.update({
      disbursedAmount,
      outstandingBalance,
      status: this.calculateLoanStatus(disbursedAmount, dto.approvedAmount),
    });

    // 6. Persist loan before creating accounting operation to satisfy FK constraints
    const savedLoan = await this.loanRepository.save(loan);

    // 7. Create accounting operation using RecordOperationUseCase
    const operationDescription =
      dto.loanType === 'accion'
        ? `Desembolso de préstamo basado en acciones para el miembro ${member.name}`
        : `Desembolso de préstamo para el miembro ${member.name}`;

    const ledgerEntries = this.createLedgerEntries(
      dto.loanType,
      disbursedAmount,
      savedLoan.id,
    );

    const operationDto: RecordOperationDto = {
      memberId: dto.memberId,
      meetingId: dto.meetingId,
      type: OperationType.LOAN_DISBURSEMENT,
      description: operationDescription,
      date: meeting.date,
      entries: ledgerEntries,
    };

    const operationResult =
      await this.recordOperationUseCase.execute(operationDto);

    // 8. Create LoanTransactionDetail for disbursement
    const transactionDetail = LoanTransactionDetail.create({
      loanId: savedLoan.id,
      transactionType: LoanTransactionType.DISBURSEMENT,
      amount: disbursedAmount,
      operationId: operationResult.operationId,
    });
    await this.loanTransactionDetailRepository.save(transactionDetail);

    // 9. Create PendingMemberPayment if disbursement is partial
    if (disbursedAmount < dto.approvedAmount) {
      const pendingAmount = dto.approvedAmount - disbursedAmount;
      const pendingPayment = PendingMemberPayment.create({
        memberId: dto.memberId,
        meetingId: dto.meetingId,
        type: PendingMemberPaymentType.LOAN,
        amount: pendingAmount,
        loanId: savedLoan.id,
      });
      await this.pendingMemberPaymentRepository.save(pendingPayment);
    }

    // 10. Return response
    return {
      loanId: savedLoan.id,
      operationId: operationResult.operationId,
      status: savedLoan.status,
    };
  }

  /**
   * Creates ledger entries based on loan type
   */
  private createLedgerEntries(
    loanType: 'corriente' | 'agil' | 'accion',
    amount: number,
    loanId: string,
  ): RecordOperationDto['entries'] {
    const entries: RecordOperationDto['entries'] = [];

    if (loanType === 'accion') {
      // For 'accion' loans:
      // - LOANS_RECEIVABLE_ACCOUNT (debit, +amount)
      // - MEMBER_EQUITY_ACCOUNT (credit, -amount)
      entries.push({
        accountType: LOANS_RECEIVABLE_ACCOUNT,
        amount: amount,
        description: 'Desembolso de préstamo de acción',
        loanId: loanId,
      });
      entries.push({
        accountType: MEMBER_EQUITY_ACCOUNT,
        amount: -amount,
        description: 'Desembolso de préstamo de acción',
        loanId: loanId,
      });
    } else {
      // For 'corriente' and 'agil' loans:
      // - CASH_ACCOUNT (credit, -amount) - money goes out
      // - LOANS_RECEIVABLE_ACCOUNT (debit, +amount) - loan receivable increases
      entries.push({
        accountType: CASH_ACCOUNT,
        amount: -amount,
        description: 'Desembolso de préstamo',
        loanId: loanId,
      });
      entries.push({
        accountType: LOANS_RECEIVABLE_ACCOUNT,
        amount: amount,
        description: 'Aumento de cuentas por cobrar (préstamo)',
        loanId: loanId,
      });
    }

    return entries;
  }

  /**
   * Calculates loan status based on disbursed amount vs approved amount
   */
  private calculateLoanStatus(
    disbursedAmount: number,
    approvedAmount: number,
  ): LoanStatus {
    if (disbursedAmount === 0) {
      return LoanStatus.PENDING;
    }
    if (disbursedAmount < approvedAmount) {
      return LoanStatus.PENDING; // Partial disbursement
    }
    return LoanStatus.ACTIVE; // Full disbursement
  }
}
