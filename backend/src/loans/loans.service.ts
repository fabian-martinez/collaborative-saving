import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, Not } from 'typeorm';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { LoanTransactionDetail } from './entities/loan-transaction-detail.entity';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { Operation } from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
} from '../common/constants/account-types';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { PendingMemberPayment } from '../meetings/entities/pending-member-payment.entity';
import { DisbursementPlanItemDto } from '../meetings/dto/disbursement-plan.dto';
import { MemberDue } from '../dues/entities/member-due.entity';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanTransactionDetail)
    private readonly loanTransactionDetailRepository: Repository<LoanTransactionDetail>,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Procesa un desembolso de préstamo (nuevo o pendiente)
   */
  async processLoanDisbursement(
    queryRunner: QueryRunner,
    meetingId: string,
    item: DisbursementPlanItemDto,
  ): Promise<void> {
    // Si es un nuevo préstamo
    if (item.newLoanRequest) {
      return this.processNewLoanDisbursement(queryRunner, meetingId, item);
    }

    // Si es un desembolso pendiente
    if (item.loanId) {
      return this.processPendingLoanDisbursement(queryRunner, meetingId, item);
    }

    throw new BadRequestException(
      'Debe especificar loanId o newLoanRequest para el desembolso',
    );
  }

  /**
   * Procesa un nuevo desembolso de préstamo
   */
  private async processNewLoanDisbursement(
    queryRunner: QueryRunner,
    meetingId: string,
    item: DisbursementPlanItemDto,
  ): Promise<void> {
    if (!item.newLoanRequest) return;

    if (item.newLoanRequest.amount > item.newLoanRequest.approvedAmount) {
      throw new BadRequestException(
        'El monto del préstamo no puede ser mayor al aprobado.',
      );
    }

    const createLoanDto = {
      member_id: item.newLoanRequest.memberId,
      meeting_id: meetingId,
      loan_type: item.newLoanRequest.loanType,
      approved_amount: item.newLoanRequest.approvedAmount,
      outstanding_balance: item.amount,
      disbursed_amount: item.amount,
      monthly_payment_amount: item.newLoanRequest.monthlyPaymentAmount,
      interest_rate: item.newLoanRequest.interestRate,
      status: this.calculateLoanStatus(
        item.amount,
        item.newLoanRequest.approvedAmount,
      ),
    };

    await this.create(createLoanDto, queryRunner);
  }

  /**
   * Procesa un desembolso pendiente de préstamo
   */
  private async processPendingLoanDisbursement(
    queryRunner: QueryRunner,
    meetingId: string,
    item: DisbursementPlanItemDto,
  ): Promise<void> {
    if (!item.loanId) {
      throw new BadRequestException(
        'No se proporcionó loanId para el desembolso pendiente',
      );
    }

    // Obtener el préstamo actual
    const loan = await this.findOne(item.loanId);

    // Validar que el préstamo esté pendiente
    if (loan.status !== 'pending') {
      throw new BadRequestException('El préstamo no está pendiente');
    }

    // Validar que el outstanding_balance sea menor o igual al approved_amount
    if (
      Number(loan.outstanding_balance) + Number(item.amount) >
      Number(loan.approved_amount)
    ) {
      throw new BadRequestException(
        'El valor entregado no puede ser mayor al aprobado',
      );
    }

    // 1. Registrar operación
    const description = item.notes || 'Desembolso pendiente de préstamo';
    const operation = queryRunner.manager.create(Operation, {
      member_id: loan.member_id,
      meeting_id: meetingId,
      description,
      type: 'LOAN_DISBURSEMENT',
    });
    await queryRunner.manager.save(operation);

    // 2. Registrar asientos contables
    const ledgerEntries = this.createDisbursementLedgerEntries(
      queryRunner,
      operation,
      loan,
      item.amount,
    );
    await queryRunner.manager.save(ledgerEntries);

    // 3. Registrar transacción de desembolso
    const disbursementTransaction = queryRunner.manager.create(
      LoanTransactionDetail,
      {
        loan_id: loan.id,
        operation_id: operation.id,
        transaction_type: 'desembolso',
        amount: item.amount,
      },
    );
    await queryRunner.manager.save(disbursementTransaction);

    // 4. Actualizar el préstamo
    const newOutstandingBalance =
      Number(loan.outstanding_balance) + Number(item.amount);
    const newDisbursedAmount =
      Number(loan.disbursed_amount) + Number(item.amount);
    const newStatus = this.calculateLoanStatus(
      newDisbursedAmount,
      loan.approved_amount,
    );

    await queryRunner.manager.update(
      Loan,
      { id: loan.id },
      {
        outstanding_balance: newOutstandingBalance,
        disbursed_amount: newDisbursedAmount,
        status: newStatus,
      },
    );
  }

  /**
   * Procesa un pago de préstamo (capital e intereses)
   */
  async processLoanPayment(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): Promise<LedgerEntry[]> {
    if (!payment.referenceId) {
      throw new BadRequestException(
        'El pago de préstamo debe incluir un referenceId.',
      );
    }

    const loan = await this.findOne(payment.referenceId);
    const interestDue =
      Number(loan.outstanding_balance) * Number(loan.interest_rate);
    const interestPaid = Math.min(payment.amount, interestDue);
    const principalPaid = payment.amount - interestPaid;

    const ledgerEntries: LedgerEntry[] = [];

    // Procesar pago de intereses
    if (interestPaid > 0) {
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          account_type: INTEREST_INCOME_ACCOUNT,
          amount: -interestPaid,
          description: payment.description,
          member_id: operation.member_id,
          loan_id: loan.id,
        }),
      );

      const interestTransaction = queryRunner.manager.create(
        LoanTransactionDetail,
        {
          loan_id: loan.id,
          operation_id: operation.id,
          transaction_type: 'pago_interes',
          amount: interestPaid,
        },
      );
      await queryRunner.manager.save(interestTransaction);
    }

    // Procesar pago de capital
    if (principalPaid > 0) {
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          account_type: LOANS_RECEIVABLE_ACCOUNT,
          amount: -principalPaid,
          description: payment.description,
          loan_id: loan.id,
        }),
      );

      const principalTransaction = queryRunner.manager.create(
        LoanTransactionDetail,
        {
          loan_id: loan.id,
          operation_id: operation.id,
          transaction_type: 'abono_capital',
          amount: principalPaid,
        },
      );
      await queryRunner.manager.save(principalTransaction);
    }

    // Actualizar el saldo del préstamo y estado
    await this.updateOutstandingBalanceAndStatus(loan.id, queryRunner);

    return ledgerEntries;
  }

  /**
   * Crea los asientos contables para un desembolso según el tipo de préstamo
   */
  private createDisbursementLedgerEntries(
    queryRunner: QueryRunner,
    operation: Operation,
    loan: Loan,
    amount: number,
  ): LedgerEntry[] {
    const entries: LedgerEntry[] = [];

    if (loan.loan_type === 'accion') {
      // Para préstamos de acción, no afecta efectivo
      entries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          loan_id: loan.id,
          account_type: LOANS_RECEIVABLE_ACCOUNT,
          amount: amount,
          description: 'Desembolso de préstamo de acción',
        }),
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          loan_id: loan.id,
          account_type: MEMBER_EQUITY_ACCOUNT,
          amount: -amount,
          description: 'Desembolso de préstamo de acción',
        }),
      );
    } else {
      // Para préstamos normales, afecta efectivo
      entries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          loan_id: loan.id,
          account_type: CASH_ACCOUNT,
          amount: -amount,
          description: 'Desembolso de préstamo',
        }),
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          loan_id: loan.id,
          account_type: LOANS_RECEIVABLE_ACCOUNT,
          amount: amount,
          description: 'Aumento de cuentas por cobrar (préstamo)',
        }),
      );
    }

    return entries;
  }

  /**
   * Calcula el estado del préstamo basado en el monto desembolsado vs aprobado
   */
  private calculateLoanStatus(
    disbursedAmount: number,
    approvedAmount: number,
  ): string {
    if (disbursedAmount >= approvedAmount) {
      return 'active';
    }
    return 'pending';
  }

  /**
   * Actualiza el saldo pendiente y el estado del préstamo
   */
  private async updateOutstandingBalanceAndStatus(
    loanId: string,
    runner?: QueryRunner,
  ): Promise<void> {
    const newBalance = await this.calculateOutstandingBalance(loanId, runner);
    const manager = runner ? runner.manager : this.dataSource.manager;

    const updateFields: Record<string, any> = {
      outstanding_balance: newBalance,
    };

    // Si el saldo es 0, cambiar estado a cerrado
    if (newBalance === 0) {
      updateFields.status = 'closed';
    }

    await manager.update(Loan, { id: loanId }, updateFields);
  }

  private async calculateOutstandingBalance(
    loanId: string,
    runner?: QueryRunner,
  ): Promise<number> {
    const manager = runner ? runner.manager : this.dataSource.manager;

    const transactions = await manager.find(LoanTransactionDetail, {
      where: { loan_id: loanId },
    });

    return transactions.reduce((balance, t) => {
      if (t.transaction_type === 'desembolso') {
        return balance + Number(t.amount);
      }
      if (t.transaction_type === 'abono_capital') {
        return balance - Number(t.amount);
      }
      return balance;
    }, 0);
  }

  private async populateLoansWithBalance(
    loans: Loan[],
    runner?: QueryRunner,
  ): Promise<Loan[]> {
    await Promise.all(
      loans.map(async (loan) => {
        loan.outstanding_balance = await this.calculateOutstandingBalance(
          loan.id,
          runner,
        );
      }),
    );
    return loans;
  }

  async create(
    createLoanDto: CreateLoanDto,
    queryRunner?: QueryRunner,
  ): Promise<Loan> {
    const isTransactionManaged = !!queryRunner;
    const runner = isTransactionManaged
      ? queryRunner
      : this.dataSource.createQueryRunner();

    if (!isTransactionManaged) {
      await runner.connect();
      await runner.startTransaction();
    }

    try {
      // 1. Validate member's capital (only for non-'accion' loans)
      if (createLoanDto.loan_type !== 'accion') {
        const memberSubscriptions = await (isTransactionManaged
          ? runner.manager.find(StockSubscription, {
              where: { member_id: createLoanDto.member_id },
              relations: { stock: true },
            })
          : this.stockSubscriptionsService.findByMember(
              createLoanDto.member_id,
            ));
        // Calculate total capita, stock subscriptions without loans
        const totalCapital = memberSubscriptions
          .filter((s) => !s.financing_loan_id)
          .reduce((sum, s) => sum + s.quantity * Number(s.stock.value), 0);
        // Calculate total no accion loans
        const totalLoans = await this.loanRepository.find({
          where: {
            member_id: createLoanDto.member_id,
            loan_type: Not('accion'),
            status: 'active',
          },
        });
        const totalLoansAmount = totalLoans.reduce(
          (sum, l) => sum + Number(l.outstanding_balance),
          0,
        );
        const totalAvailableCapital = (totalCapital - totalLoansAmount) * 2;

        if (createLoanDto.approved_amount > totalAvailableCapital) {
          throw new BadRequestException(
            `Requested loan amount (${createLoanDto.approved_amount}) exceeds member's total capital (${totalAvailableCapital}).`,
          );
        }
      }

      if (createLoanDto.outstanding_balance === undefined) {
        createLoanDto.outstanding_balance = createLoanDto.approved_amount;
      }

      if (createLoanDto.disbursed_amount === undefined) {
        createLoanDto.disbursed_amount = createLoanDto.outstanding_balance;
      }

      // 2. Create Operation
      createLoanDto.status = this.calculateLoanStatus(
        createLoanDto.disbursed_amount,
        createLoanDto.approved_amount,
      );

      const operationDescription =
        createLoanDto.loan_type === 'accion'
          ? `Stock-based loan disbursement for member ${
              createLoanDto.member_id
            }`
          : `Loan disbursement for member ${createLoanDto.member_id}`;

      const operation = runner.manager.create(Operation, {
        member_id: createLoanDto.member_id,
        meeting_id: createLoanDto.meeting_id,
        description: operationDescription,
        type: 'LOAN_DISBURSEMENT',
      });
      await runner.manager.save(operation);

      // 3. Create Loan entity
      const loanEntity = runner.manager.create(Loan, createLoanDto);
      const loan = await runner.manager.save(loanEntity);

      // 3.1 Crear pago pendiente si el desembolso es parcial
      if (createLoanDto.disbursed_amount < createLoanDto.approved_amount) {
        const pendingAmount =
          createLoanDto.approved_amount - createLoanDto.disbursed_amount;
        const pendingLoan = runner.manager.create(PendingMemberPayment, {
          member_id: createLoanDto.member_id,
          meeting_id: createLoanDto.meeting_id,
          type: 'loan',
          status: 'pending',
          amount: pendingAmount,
          loan_id: loan.id,
          stock_subscription_id: null,
        });
        await runner.manager.save(pendingLoan);
      }

      // 4. Create disbursement transaction
      const disbursement = runner.manager.create(LoanTransactionDetail, {
        loan_id: loan.id,
        operation_id: operation.id,
        transaction_type: 'desembolso',
        amount: createLoanDto.disbursed_amount,
      });
      await runner.manager.save(disbursement);

      // 5. Create Ledger Entries
      const ledgerEntries = this.createDisbursementLedgerEntries(
        runner,
        operation,
        loan,
        createLoanDto.disbursed_amount,
      );
      await runner.manager.save(ledgerEntries);

      if (!isTransactionManaged) {
        await runner.commitTransaction();
      }

      return loan;
    } catch (err) {
      if (!isTransactionManaged) {
        await runner.rollbackTransaction();
      }
      throw err;
    } finally {
      if (!isTransactionManaged) {
        await runner.release();
      }
    }
  }

  async findAll(): Promise<Loan[]> {
    const loans = await this.loanRepository.find();
    return this.populateLoansWithBalance(loans);
  }

  async findActiveByMember(memberId: string): Promise<Loan[]> {
    const loans = await this.loanRepository.find({
      where: {
        member_id: memberId,
        status: 'active',
      },
    });
    return this.populateLoansWithBalance(loans);
  }

  async findOne(id: string): Promise<Loan> {
    const loan = await this.loanRepository.findOneBy({ id });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    const [populatedLoan] = await this.populateLoansWithBalance([loan]);
    return populatedLoan;
  }

  async update(id: string, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.loanRepository.preload({
      id,
      ...updateLoanDto,
    });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    const savedLoan = await this.loanRepository.save(loan);
    const [populatedLoan] = await this.populateLoansWithBalance([savedLoan]);
    return populatedLoan;
  }

  async updateOutstandingBalance(loanId: string, runner?: QueryRunner) {
    return this.updateOutstandingBalanceAndStatus(loanId, runner);
  }

  async remove(id: string): Promise<void> {
    const result = await this.loanRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
  }
}
