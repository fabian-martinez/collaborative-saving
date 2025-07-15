import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner, Not, In } from 'typeorm';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { LoanTransactionDetail } from './entities/loan-transaction-detail.entity';
import { Operation } from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  MEMBER_EQUITY_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
} from '../common/constants/account-types';
import { PendingMemberPayment } from '../meetings/entities/pending-member-payment.entity';
import { DisbursementPlanItemDto } from '../meetings/dto/disbursement-plan.dto';
import { MemberDue } from '../dues/entities/member-due.entity';
import { StocksService } from '../stocks/stocks.service';
import { StockSubscription } from 'src/stock-subscriptions/entities/stock-subscription.entity';
import { Meeting } from 'src/meetings/entities/meeting.entity';
import { Stock } from 'src/stocks/entities/stock.entity';
import { MeetingsService } from 'src/meetings/meetings.service';
import { StockSubscriptionsService } from 'src/stock-subscriptions/stock-subscriptions.service';
import { OperationType } from '../common/enums/operation-type.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanTransactionDetail)
    private readonly loanTransactionDetailRepository: Repository<LoanTransactionDetail>,
    private readonly dataSource: DataSource,
    private readonly stocksService: StocksService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    @Inject(forwardRef(() => MeetingsService))
    private readonly meetingService: MeetingsService,
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
      type: OperationType.LOAN_DISBURSEMENT,
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
        transaction_type: TransactionType.DISBURSEMENT,
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
          transaction_type: TransactionType.INTEREST_PAYMENT,
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
          transaction_type: TransactionType.PRINCIPAL_PAYMENT,
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
      if (t.transaction_type === TransactionType.DISBURSEMENT) {
        return balance + Number(t.amount);
      }
      if (t.transaction_type === TransactionType.PRINCIPAL_PAYMENT) {
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

  /**
   * Devuelve la capacidad máxima de endeudamiento por tipo de préstamo para un miembro
   * Si se pasa 'type', retorna solo la capacidad para ese tipo
   */
  async getDebtCapacitiesByType(
    memberId: string,
    type?: 'accion' | 'agil' | 'corriente',
  ): Promise<
    | {
        accion: {
          maxAmount: null;
          availableCapital: number;
          description: string;
        };
        corriente: {
          maxAmount: number;
          availableCapital: number;
          description: string;
        };
        agil: {
          maxAmount: number;
          availableCapital: number;
          description: string;
        };
      }
    | {
        maxAmount: null | number;
        availableCapital: number;
        description: string;
      }
  > {
    const memberSubscriptions: StockSubscription[] =
      await this.stockSubscriptionsService.findByMember(memberId);
    const totalCapital = memberSubscriptions
      .filter((s) => !s.financing_loan_id)
      .reduce((sum, s) => sum + s.quantity * Number(s.stock.value), 0);

    const totalLoans = await this.loanRepository.find({
      where: {
        member_id: memberId,
        loan_type: Not(In(['accion', 'agil'])),
        status: In(['active', 'pending']),
      },
    });
    const totalLoansAmount = totalLoans.reduce(
      (sum, l) => sum + Number(l.outstanding_balance),
      0,
    );
    const availableCapital = totalCapital - totalLoansAmount;
    const maxNormalLoan = availableCapital > 0 ? availableCapital * 2 : 0;

    const result = {
      accion: {
        maxAmount: null,
        availableCapital: totalCapital,
        description:
          "No existe restricción de capital para préstamos de tipo 'acción'.",
      },

      corriente: {
        maxAmount: maxNormalLoan,
        availableCapital: availableCapital,
        description:
          'El monto máximo permitido es el doble del capital disponible descontando préstamos activos.',
      },
      agil: {
        maxAmount: maxNormalLoan,
        availableCapital: availableCapital,
        description:
          'El monto máximo permitido es el doble del capital disponible descontando préstamos activos.',
      },
    };

    if (type) return result[type];
    return result;
  }

  async create(
    createLoanDto: CreateLoanDto,
    queryRunner?: QueryRunner,
  ): Promise<Loan> {
    return this.createLoanByType(createLoanDto, queryRunner);
  }

  /**
   * Delegador principal para la creación de préstamos según tipo
   */
  private async createLoanByType(
    createLoanDto: CreateLoanDto,
    queryRunner?: QueryRunner,
  ): Promise<Loan> {
    switch (createLoanDto.loan_type) {
      case 'accion':
        return this.createAccionLoan(createLoanDto, queryRunner);
      case 'corriente':
        return this.createCorrienteLoan(createLoanDto, queryRunner);
      case 'agil':
        return this.createAgilLoan(createLoanDto, queryRunner);
      default:
        throw new BadRequestException(
          `Tipo de préstamo no válido: ${createLoanDto.loan_type}`,
        );
    }
  }

  /**
   * Lógica específica para préstamos de tipo 'acción'
   */
  private async createAccionLoan(
    createLoanDto: CreateLoanDto,
    queryRunner?: QueryRunner,
  ): Promise<Loan> {
    return this.createLoanBase(
      createLoanDto,
      queryRunner,
      (qr, op, loan, amount) =>
        this.createAccionLedgerEntries(qr, op, loan, amount),
    );
  }

  /**
   * Lógica específica para préstamos de tipo 'corriente'
   */
  private async createCorrienteLoan(
    createLoanDto: CreateLoanDto,
    queryRunner?: QueryRunner,
  ): Promise<Loan> {
    const normalCapacity = (await this.getDebtCapacitiesByType(
      createLoanDto.member_id,
      'corriente',
    )) as {
      maxAmount: number;
      availableCapital: number;
      description: string;
    };
    if (
      normalCapacity.maxAmount !== null &&
      createLoanDto.approved_amount > normalCapacity.maxAmount
    ) {
      throw new BadRequestException(
        `El monto solicitado (${createLoanDto.approved_amount}) excede el máximo permitido (${normalCapacity.maxAmount}).`,
      );
    }
    return this.createLoanBase(
      createLoanDto,
      queryRunner,
      (qr, op, loan, amount) =>
        this.createCorrienteLedgerEntries(qr, op, loan, amount),
    );
  }

  /**
   * Lógica específica para préstamos de tipo 'ágil'
   * El monto máximo disponible es el valor de cierto tipo de acción por la cantidad de suscripciones del socio
   */
  private async createAgilLoan(
    createLoanDto: CreateLoanDto,
    queryRunner?: QueryRunner,
  ): Promise<Loan> {
    // Consultar el efectivo en la reunión activa
    const meeting: Meeting | null = await this.meetingService.findActive();
    if (!meeting) {
      throw new BadRequestException('No hay una reunión activa');
    }
    // Consultar el valor de las acciones 'agil'
    const agilStocks: Stock[] =
      await this.stocksService.getStocksByType('bono');
    const agilStockValue = agilStocks.reduce(
      (sum, s) => sum + Number(s.value),
      0,
    );
    // Consultar la cantidad total de suscripciones activas a acciones 'agil'
    const agilStockIds = agilStocks.map((s) => s.id);
    const allSubscriptions = await this.stockSubscriptionsService.findAll();
    const agilActiveSubscriptions = allSubscriptions.filter(
      (sub: StockSubscription) =>
        agilStockIds.includes(sub.stock_id) && sub.status === 'active',
    );
    const agilStockTotalQuantity = agilActiveSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.quantity),
      0,
    );
    const totalAgilCapital = agilStockValue * agilStockTotalQuantity;
    if (createLoanDto.approved_amount > totalAgilCapital) {
      throw new BadRequestException(
        `El monto solicitado (${createLoanDto.approved_amount}) excede el máximo permitido por sus acciones ágiles (${totalAgilCapital}).`,
      );
    }
    return this.createLoanBase(
      createLoanDto,
      queryRunner,
      (qr, op, loan, amount) =>
        this.createAgilLedgerEntries(qr, op, loan, amount),
    );
  }

  /**
   * Lógica común para la creación de préstamos (operación, asientos, pagos pendientes, etc.)
   * Recibe como parámetro la función de generación de asientos contables
   */
  private async createLoanBase(
    createLoanDto: CreateLoanDto,
    queryRunner: QueryRunner | undefined,
    ledgerEntriesFn: (
      queryRunner: QueryRunner,
      operation: Operation,
      loan: Loan,
      amount: number,
    ) => LedgerEntry[],
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
      if (createLoanDto.outstanding_balance === undefined) {
        createLoanDto.outstanding_balance = createLoanDto.approved_amount;
      }
      if (createLoanDto.disbursed_amount === undefined) {
        createLoanDto.disbursed_amount = createLoanDto.outstanding_balance;
      }
      // Estado inicial
      createLoanDto.status = this.calculateLoanStatus(
        createLoanDto.disbursed_amount,
        createLoanDto.approved_amount,
      );
      const operationDescription =
        createLoanDto.loan_type === 'accion'
          ? `Desembolso de préstamo basado en acciones para el miembro ${createLoanDto.member_id}`
          : `Desembolso de préstamo para el miembro ${createLoanDto.member_id}`;
      const operation = runner.manager.create(Operation, {
        member_id: createLoanDto.member_id,
        meeting_id: createLoanDto.meeting_id,
        description: operationDescription,
        type: OperationType.LOAN_DISBURSEMENT,
      });
      await runner.manager.save(operation);
      // Crear entidad Loan
      const loanEntity = runner.manager.create(Loan, createLoanDto);
      const loan = await runner.manager.save(loanEntity);
      // Crear pago pendiente si el desembolso es parcial
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
      // Crear transacción de desembolso
      const disbursement = runner.manager.create(LoanTransactionDetail, {
        loan_id: loan.id,
        operation_id: operation.id,
        transaction_type: TransactionType.DISBURSEMENT,
        amount: createLoanDto.disbursed_amount,
      });
      await runner.manager.save(disbursement);
      // Crear asientos contables según el tipo
      const ledgerEntries = ledgerEntriesFn(
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

  /**
   * Asientos contables para préstamo de tipo 'acción'
   */
  private createAccionLedgerEntries(
    queryRunner: QueryRunner,
    operation: Operation,
    loan: Loan,
    amount: number,
  ): LedgerEntry[] {
    return [
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
    ];
  }

  /**
   * Asientos contables para préstamo de tipo 'corriente'
   */
  private createCorrienteLedgerEntries(
    queryRunner: QueryRunner,
    operation: Operation,
    loan: Loan,
    amount: number,
  ): LedgerEntry[] {
    return [
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
    ];
  }

  /**
   * Asientos contables para préstamo de tipo 'ágil'
   * Por ahora igual a corriente, pero fácilmente editable
   */
  private createAgilLedgerEntries(
    queryRunner: QueryRunner,
    operation: Operation,
    loan: Loan,
    amount: number,
  ): LedgerEntry[] {
    return this.createCorrienteLedgerEntries(
      queryRunner,
      operation,
      loan,
      amount,
    );
  }

  async findAll(): Promise<Loan[]> {
    const loans = await this.loanRepository.find();
    return this.populateLoansWithBalance(loans);
  }

  async findActiveByMember(memberId: string): Promise<Loan[]> {
    const loans = await this.loanRepository.find({
      where: {
        member_id: memberId,
        status: In(['active', 'pending']),
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
