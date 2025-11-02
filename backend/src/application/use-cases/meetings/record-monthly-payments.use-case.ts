import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { RecordMonthlyPaymentsDto } from '@application/dto/meetings/record-monthly-payments.dto';
import { RecordMonthlyPaymentsResponseDto } from '@application/dto/meetings/record-monthly-payments-response.dto';
import { OperationRecorder } from '@domain/services/operation-recorder.service';
import { LoanPaymentProcessor } from '@domain/services/loan-payment-processor.service';
import { DuesService } from '../../../dues/dues.service';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Operation } from '../../../operations/entities/operation.entity';
import { LedgerEntry } from '../../../ledger-entries/entities/ledger-entry.entity';
import { Loan } from '../../../loans/entities/loan.entity';
import { LoanTransactionDetail } from '../../../loans/entities/loan-transaction-detail.entity';
import { OperationType } from '../../../common/enums/operation-type.enum';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import {
  CASH_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
  STOCK_FEE_INCOME_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  FEE_INCOME_ACCOUNT,
  INSURANCE_INCOME_ACCOUNT,
} from '../../../common/constants/account-types';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class RecordMonthlyPaymentsUseCase {
  constructor(
    private readonly operationRecorder: OperationRecorder,
    private readonly loanPaymentProcessor: LoanPaymentProcessor,
    private readonly duesService: DuesService,
    private readonly meetingRepository: MeetingRepository,
    private readonly memberRepository: MemberRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    dto: RecordMonthlyPaymentsDto,
  ): Promise<RecordMonthlyPaymentsResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar reuni?n activa (o usar meetingId del DTO)
      let meetingId = dto.meetingId;
      if (!meetingId) {
        const activeMeeting = await this.meetingRepository.findActive();
        if (!activeMeeting) {
          throw new NotFoundException('No active meeting found');
        }
        meetingId = activeMeeting.id;
      }

      // 2. Validar que socio exista y est? activo
      const member = await this.memberRepository.findById(dto.memberId);
      if (!member) {
        throw new NotFoundException(
          `Member with ID ${dto.memberId} not found`,
        );
      }

      if (!member.isActive()) {
        throw new BadRequestException(`Member ${dto.memberId} is not active`);
      }

      // 3. Obtener cuotas esperadas
      const expectedDues = await this.duesService.getMemberDuesForActiveMeeting(
        dto.memberId,
      );

      // 4. Validar pagos contra cuotas
      this.validatePayments(dto.payments, expectedDues);

      // 5. Procesar pagos
      const allLedgerSpecs: any[] = [];
      const loanPaymentsSummary: Array<{
        loanId: string;
        interestPaid: number;
        principalPaid: number;
        newBalance: number;
      }> = [];
      const loansToUpdate: Array<{ loan: Loan; newBalance: number; newStatus: LoanStatus }> = [];
      const transactionDetailsToSave: Partial<LoanTransactionDetail>[] = [];

      for (const payment of dto.payments) {
        if (payment.type === 'loan_payment') {
          // Procesar pago de pr?stamo
          const loan = await queryRunner.manager.findOneBy(Loan, {
            id: payment.referenceId,
          });

          if (!loan) {
            throw new NotFoundException(
              `Loan with ID ${payment.referenceId} not found`,
            );
          }

          const result = this.loanPaymentProcessor.processPayment(
            loan,
            payment,
          );

          allLedgerSpecs.push(...result.ledgerSpecs);
          transactionDetailsToSave.push(
            ...result.transactionSpecs.map((spec) => ({
              loan_id: spec.loanId,
              transaction_type: spec.transactionType,
              amount: spec.amount,
              transaction_date: new Date(),
            })),
          );

          loansToUpdate.push({
            loan,
            newBalance: result.newBalance,
            newStatus: result.newStatus,
          });

          const interestPaid = result.transactionSpecs
            .filter((t) => t.transactionType === TransactionType.INTEREST_PAYMENT)
            .reduce((sum, t) => sum + t.amount, 0);
          const principalPaid = result.transactionSpecs
            .filter(
              (t) => t.transactionType === TransactionType.PRINCIPAL_PAYMENT,
            )
            .reduce((sum, t) => sum + t.amount, 0);

          loanPaymentsSummary.push({
            loanId: loan.id,
            interestPaid,
            principalPaid,
            newBalance: result.newBalance,
          });
        } else {
          // Crear LedgerEntrySpec directo para otros tipos
          const accountType = this.getAccountTypeForPaymentType(payment.type);
          allLedgerSpecs.push({
            accountType,
            amount: -payment.amount, // Cr?dito
            description: payment.description,
            loanId: payment.referenceId,
            mandatoryContributionId:
              payment.type === 'mandatory_contribution'
                ? payment.referenceId
                : undefined,
            stockId:
              payment.type === 'stock_fee' ? payment.referenceId : undefined,
          });
        }
      }

      // 6. Agregar LedgerEntrySpec de CASH (d?bito) por el total
      const totalAmount = dto.payments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      allLedgerSpecs.unshift({
        accountType: CASH_ACCOUNT,
        amount: totalAmount, // D?bito
        description: 'Pago recibido',
      });

      // 7. Usar OperationRecorder para crear operation y ledger entries
      const { operation: operationData, ledgerEntries: ledgerEntriesData } =
        this.operationRecorder.recordOperation(
          {
            type: OperationType.MONTHLY_PAYMENT,
            description: `Pago mensual - ${dto.memberId}`,
            meetingId,
            memberId: dto.memberId,
          },
          allLedgerSpecs,
        );

      // 8. Persistir Operation
      const savedOperation = await queryRunner.manager.save(
        Operation,
        operationData,
      );

      // 9. Persistir LedgerEntries (asignar operation_id)
      const ledgerEntriesToSave = ledgerEntriesData.map((entry) => ({
        ...entry,
        operation_id: savedOperation.id,
      }));
      await queryRunner.manager.save(LedgerEntry, ledgerEntriesToSave);

      // 10. Persistir LoanTransactionDetails
      const transactionDetailsWithOperationId =
        transactionDetailsToSave.map((detail) => ({
          ...detail,
          operation_id: savedOperation.id,
        }));
      await queryRunner.manager.save(
        LoanTransactionDetail,
        transactionDetailsWithOperationId,
      );

      // 11. Actualizar pr?stamos
      for (const { loan, newBalance, newStatus } of loansToUpdate) {
        await queryRunner.manager.update(
          Loan,
          { id: loan.id },
          {
            outstanding_balance: newBalance,
            status: newStatus,
          },
        );
      }

      // 12. Confirmar transacci?n
      await queryRunner.commitTransaction();

      // 13. Retornar response DTO
      return {
        operationId: savedOperation.id,
        meetingId,
        memberId: dto.memberId,
        totalAmount,
        paymentsProcessed: dto.payments.length,
        loanPaymentsSummary,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private validatePayments(
    payments: any[],
    expectedDues: any[],
  ): void {
    // Validar que cada pago corresponde a una cuota esperada
    for (const payment of payments) {
      const expectedDue = expectedDues.find(
        (due) =>
          due.type === payment.type &&
          due.referenceId === payment.referenceId,
      );

      if (!expectedDue) {
        throw new BadRequestException(
          `Payment type ${payment.type} with referenceId ${payment.referenceId} does not match any expected due`,
        );
      }

      // Validar que el monto no exceda la cuota (permitir pagos parciales)
      if (payment.amount > expectedDue.amount + 0.01) {
        throw new BadRequestException(
          `Payment amount ${payment.amount} exceeds expected due amount ${expectedDue.amount}`,
        );
      }

      // Validar tipo de pago v?lido
      const validTypes = [
        'mandatory_contribution',
        'stock_fee',
        'loan_payment',
        'fee',
        'insurance',
      ];
      if (!validTypes.includes(payment.type)) {
        throw new BadRequestException(`Invalid payment type: ${payment.type}`);
      }
    }
  }

  private getAccountTypeForPaymentType(
    paymentType: string,
  ): string {
    const mapping: Record<string, string> = {
      mandatory_contribution: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
      stock_fee: STOCK_FEE_INCOME_ACCOUNT,
      fee: FEE_INCOME_ACCOUNT,
      insurance: INSURANCE_INCOME_ACCOUNT,
    };

    return mapping[paymentType] || FEE_INCOME_ACCOUNT;
  }
}
