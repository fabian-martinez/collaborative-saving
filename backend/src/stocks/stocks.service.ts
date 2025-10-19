import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository, QueryRunner } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { MembersService } from '../members/members.service';
import { LoansService } from '../loans/loans.service';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { BuyStockForMemberDto } from './dto/buy-stock-for-member.dto';
import { Operation } from '../operations/entities/operation.entity';
import { Loan } from '../loans/entities/loan.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  STOCK_TRANSFER_ACCOUNT,
} from '../common/constants/account-types';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { OperationType } from '../common/enums/operation-type.enum';
import { StockModificationDto } from './dto/stock-modification.dto';
import { LoanTransactionDetail } from '../loans/entities/loan-transaction-detail.entity';
import { TransactionType } from '../common/enums/transaction-type.enum';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock)
    private readonly stocksRepository: Repository<Stock>,
    @InjectRepository(StockSubscription)
    private readonly stockSubscriptionsRepository: Repository<StockSubscription>,
    @InjectRepository(Operation)
    private readonly operationsRepository: Repository<Operation>,
    private readonly dataSource: DataSource,
    private readonly membersService: MembersService,
    @Inject(forwardRef(() => LoansService))
    private readonly loansService: LoansService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
  ) {}

  create(createStockDto: CreateStockDto): Promise<Stock> {
    createStockDto.value = Number(createStockDto.monthly_contribution);
    const stock = this.stocksRepository.create(createStockDto);
    return this.stocksRepository.save(stock);
  }

  findAll(withDeleted = false): Promise<Stock[]> {
    return this.stocksRepository.find({
      withDeleted: withDeleted,
    });
  }

  async findAllWithSubscriptionCount(
    withDeleted = false,
  ): Promise<Array<Stock & { subscriptionCount: number }>> {
    const stocks = await this.stocksRepository.find({
      withDeleted: withDeleted,
    });

    const stocksWithCount = await Promise.all(
      stocks.map(async (stock) => {
        const result = await this.stockSubscriptionsRepository
          .createQueryBuilder('subscription')
          .select('SUM(subscription.quantity)', 'totalQuantity')
          .where('subscription.stock_id = :stockId', { stockId: stock.id })
          .andWhere('subscription.quantity > 0')
          .getRawOne<{ totalQuantity: string | null }>();

        const subscriptionCount = Number(result?.totalQuantity) || 0;

        return {
          ...stock,
          subscriptionCount,
        };
      }),
    );

    return stocksWithCount;
  }

  findOnlyDeleted(): Promise<Stock[]> {
    return this.stocksRepository.find({
      withDeleted: true,
      where: {
        deleted_at: Not(IsNull()),
      },
    });
  }

  async findOne(id: string, withDeleted = false): Promise<Stock> {
    const stock = await this.stocksRepository.findOne({
      where: { id },
      withDeleted: withDeleted,
    });
    if (!stock) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
    return stock;
  }
  async getStockSubscriptionByMemberAndStock({
    stockId,
    memberId,
  }: {
    stockId: string;
    memberId: string;
  }): Promise<StockSubscription[]> {
    if (!stockId || !memberId) {
      throw new BadRequestException('Stock ID and member ID are required');
    }
    const stockSubscriptions = await this.stockSubscriptionsRepository.find({
      where: { stock_id: stockId, member_id: memberId },
    });
    if (!stockSubscriptions) {
      throw new NotFoundException(`Stock #${stockId} not found`);
    }
    return stockSubscriptions;
  }
  /// get stocks by type
  async getStocksByType(type: string): Promise<Stock[]> {
    const stocks = await this.stocksRepository.find({
      where: { type },
    });
    return stocks;
  }
  // get stock value and total quantity of stock subscriptions
  async getStockValueAndTotalQuantity(stockId: string): Promise<{
    value: number;
    totalQuantity: number;
  }> {
    const stock = await this.findOne(stockId);
    const stockSubscriptions =
      await this.stockSubscriptionsService.findAllWithDetails();
    const stockSubscriptionsForStock = stockSubscriptions.filter(
      (sub) => sub.stock_id === stockId,
    );
    const totalQuantity = stockSubscriptionsForStock.reduce(
      (sum, sub) => sum + Number(sub.quantity),
      0,
    );
    return {
      value: stock.value,
      totalQuantity,
    };
  }

  async update(id: string, updateStockDto: UpdateStockDto): Promise<Stock> {
    const stock = await this.stocksRepository.preload({
      id,
      ...updateStockDto,
    });
    if (!stock) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
    return this.stocksRepository.save(stock);
  }

  async remove(id: string): Promise<void> {
    const result = await this.stocksRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
  }

  async restore(id: string): Promise<void> {
    const result = await this.stocksRepository.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Stock #${id} not found`);
    }
  }

  async purchaseForMember(meetingId: string, dto: BuyStockForMemberDto) {
    // 2. Validar que el socio existe
    const member = await this.membersService.findOne(dto.memberId);
    if (!member) {
      throw new BadRequestException('El socio no existe.');
    }
    // 3. Ejecutar la compra de acciones usando la lógica de OperationsService, pero asociando la operación a la reunión
    // Adaptar la lógica para pasar el meeting_id
    return this._purchaseStock({
      meetingId,
      memberId: dto.memberId,
      stockId: dto.stockId,
      quantity: dto.quantity,
      cashAmount: dto.cashAmount,
      loanDetails: dto.loanDetails,
    });
  }

  private async _purchaseStock({
    meetingId,
    memberId,
    stockId,
    quantity,
    cashAmount,
    loanDetails,
  }: {
    meetingId: string;
    memberId: string;
    stockId: string;
    quantity: number;
    cashAmount: number;
    loanDetails?: {
      interest_rate: number;
      loan_type: 'corriente' | 'agil' | 'accion';
    };
  }) {
    // 1. Validar camos de entrada
    if (quantity <= 0) {
      throw new BadRequestException(
        'La cantidad de acciones debe ser un número positivo.',
      );
    }
    if (cashAmount < 0) {
      throw new BadRequestException('El monto de efectivo debe ser positivo.');
    }
    if (memberId === null) {
      throw new BadRequestException('El socio no existe.');
    }
    if (stockId === null) {
      throw new BadRequestException('La acción no existe.');
    }
    if (meetingId === null) {
      throw new BadRequestException('La reunión no existe.');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const stock = await this.findOne(stockId);

      const operation = queryRunner.manager.create(Operation, {
        member_id: memberId,
        meeting_id: meetingId,
        description: `Compra de ${quantity} acciones de ${stock.type}`,
        type: OperationType.STOCK_PURCHASE,
      });

      await queryRunner.manager.save(operation);

      const totalValue = stock.value * quantity;
      const financedAmount = totalValue - cashAmount;
      let newLoan: Loan | null = null;

      if (financedAmount > 0 && loanDetails) {
        // validar datos de crédito
        if (loanDetails.interest_rate <= 0) {
          throw new BadRequestException(
            'La tasa de interés debe ser positiva.',
          );
        }
        if (loanDetails.loan_type !== 'accion') {
          throw new BadRequestException('El tipo de crédito no es válido.');
        }
        newLoan = await this.loansService.create(
          {
            member_id: memberId,
            meeting_id: meetingId,
            approved_amount: financedAmount,
            monthly_payment_amount: 0,
            outstanding_balance: financedAmount,
            interest_rate: Number(loanDetails.interest_rate),
            loan_type: loanDetails.loan_type,
            status: 'active',
          },
          queryRunner,
        );
      }

      const stockSubscription = await this.stockSubscriptionsService.create(
        {
          member_id: memberId,
          stock_id: stockId,
          quantity,
          financing_loan_id: newLoan ? newLoan.id : null,
        },
        queryRunner,
      );
      // Asientos contables
      const ledgerEntries: LedgerEntry[] = [];
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id: operation.id,
          stock_id: stockId,
          stock_subscription_id: stockSubscription.id,
          account_type: STOCK_CAPITAL_ACCOUNT,
          amount: -totalValue,
        }),
      );
      if (cashAmount > 0) {
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id: operation.id,
            account_type: CASH_ACCOUNT,
            amount: cashAmount,
          }),
        );
      }
      if (newLoan) {
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id: operation.id,
            account_type: LOANS_RECEIVABLE_ACCOUNT,
            loan_id: newLoan.id,
            amount: financedAmount,
          }),
        );
      }
      await queryRunner.manager.save(ledgerEntries);
      await queryRunner.commitTransaction();
      return {
        message: 'Compra de acciones registrada exitosamente.',
        operationId: operation.id,
        memberId,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async processStockModification(dto: StockModificationDto): Promise<{
    operationId: string;
    message: string;
    details: any;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      switch (dto.modificationType) {
        case 'STOCK_MODIFICATION':
          return await this.processStockExchange(queryRunner, dto);
        case 'STOCK_TRANSFER':
          return await this.processStockTransfer(queryRunner, dto);
        case 'STOCK_LOAN_PAYMENT':
          return await this.processStockLoanPayment(queryRunner, dto);
        default:
          throw new BadRequestException(
            `Tipo de modificación no válido: ${dto.modificationType}`,
          );
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async processStockExchange(
    queryRunner: QueryRunner,
    dto: StockModificationDto,
  ): Promise<{
    operationId: string;
    message: string;
    details: any;
  }> {
    if (
      !dto.fromSubscriptionId ||
      !dto.fromQuantity ||
      !dto.toStockId ||
      !dto.toQuantity
    ) {
      throw new BadRequestException(
        'Faltan datos requeridos para el intercambio de acciones',
      );
    }

    // Validar suscripción origen
    const fromSubscription = await this.stockSubscriptionsService.findOne(
      dto.fromSubscriptionId,
    );
    if (!fromSubscription || fromSubscription.member_id !== dto.memberId) {
      throw new BadRequestException('Suscripción de origen no válida');
    }
    if (Number(fromSubscription.quantity) < dto.fromQuantity) {
      throw new BadRequestException(
        'Cantidad insuficiente en la suscripción de origen',
      );
    }

    // Obtener acciones origen y destino
    const fromStock = await this.findOne(fromSubscription.stock_id);
    const toStock = await this.findOne(dto.toStockId);

    // Calcular valores
    const fromValue = fromStock.value * dto.fromQuantity;
    const toValue = toStock.value * dto.toQuantity;
    const difference = fromValue - toValue;

    // Crear operación
    const operation = queryRunner.manager.create(Operation, {
      member_id: dto.memberId,
      meeting_id: dto.meetingId,
      description: `Intercambio ${dto.fromQuantity} ${fromStock.type} → ${dto.toQuantity} ${toStock.type}`,
      type: OperationType.STOCK_MODIFICATION,
    });
    await queryRunner.manager.save(operation);

    // Actualizar suscripción origen
    const newFromQuantity =
      Number(fromSubscription.quantity) - dto.fromQuantity;
    if (newFromQuantity > 0) {
      await queryRunner.manager.update(
        'stock_subscriptions',
        { id: dto.fromSubscriptionId },
        { quantity: newFromQuantity },
      );
    } else {
      await queryRunner.manager.update(
        'stock_subscriptions',
        { id: dto.fromSubscriptionId },
        { quantity: 0 },
      );
    }

    // Crear o actualizar suscripción destino
    await this.stockSubscriptionsService.create(
      {
        member_id: dto.memberId,
        stock_id: dto.toStockId,
        quantity: dto.toQuantity,
        financing_loan_id: null,
      },
      queryRunner,
    );

    // Crear asientos contables
    const ledgerEntries: LedgerEntry[] = [];

    // Disminuir capital de acciones origen
    ledgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        stock_id: fromSubscription.stock_id,
        stock_subscription_id: dto.fromSubscriptionId,
        account_type: STOCK_CAPITAL_ACCOUNT,
        amount: fromValue,
        description: `Reducción de ${dto.fromQuantity} ${fromStock.type}`,
      }),
    );

    // Aumentar capital de acciones destino
    ledgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        stock_id: dto.toStockId,
        account_type: STOCK_CAPITAL_ACCOUNT,
        amount: -toValue,
        description: `Adquisición de ${dto.toQuantity} ${toStock.type}`,
      }),
    );

    // Manejar diferencia si existe
    if (difference !== 0) {
      if (dto.differenceHandling === 'credit' && dto.targetLoanId) {
        if (difference > 0) {
          // Aplicar diferencia a crédito existente
          const loan = await this.loansService.findOne(dto.targetLoanId);
          const newBalance = Number(loan.outstanding_balance) - difference;

          await queryRunner.manager.update(
            'loans',
            { id: dto.targetLoanId },
            { outstanding_balance: newBalance },
          );

          // Asiento contable para el pago del crédito
          ledgerEntries.push(
            queryRunner.manager.create(LedgerEntry, {
              operation_id: operation.id,
              account_type: LOANS_RECEIVABLE_ACCOUNT,
              amount: -difference,
              description: `Pago de crédito con diferencia de intercambio`,
            }),
          );
        } else {
          // Crear nuevo crédito para financiar la diferencia
          const loanType =
            dto.targetLoanId === 'new_action_loan' ? 'accion' : 'corriente';
          await this.loansService.create(
            {
              member_id: dto.memberId,
              meeting_id: dto.meetingId,
              approved_amount: Math.abs(difference),
              monthly_payment_amount: 0,
              outstanding_balance: Math.abs(difference),
              interest_rate: 0.02, // 2% interés
              loan_type: loanType,
              status: 'active',
            },
            queryRunner,
          );

          // Asiento contable para el nuevo crédito
          ledgerEntries.push(
            queryRunner.manager.create(LedgerEntry, {
              operation_id: operation.id,
              account_type: LOANS_RECEIVABLE_ACCOUNT,
              amount: Math.abs(difference),
              description: `Nuevo crédito ${loanType} por diferencia de intercambio`,
            }),
          );
        }
      } else {
        // Diferencia en efectivo
        // Si difference > 0: el socio debe pagar (sale dinero de caja = negativo)
        // Si difference < 0: el socio debe recibir (entra dinero a caja = positivo)
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id: operation.id,
            account_type: CASH_ACCOUNT,
            amount: -difference, // Invertir el signo para que sea correcto contablemente
            description: `Diferencia de intercambio en efectivo`,
          }),
        );
      }
    }

    await queryRunner.manager.save(ledgerEntries);
    await queryRunner.commitTransaction();

    return {
      operationId: operation.id,
      message: 'Intercambio de acciones procesado exitosamente',
      details: {
        fromStock: fromStock.type,
        fromQuantity: dto.fromQuantity,
        fromValue,
        toStock: toStock.type,
        toQuantity: dto.toQuantity,
        toValue,
        difference,
        differenceHandling: dto.differenceHandling,
      },
    };
  }

  private async processStockTransfer(
    queryRunner: QueryRunner,
    dto: StockModificationDto,
  ): Promise<{
    operationId: string;
    message: string;
    details: any;
  }> {
    if (
      !dto.transferSubscriptionId ||
      !dto.transferQuantity ||
      !dto.toMemberId
    ) {
      throw new BadRequestException(
        'Faltan datos requeridos para la transferencia',
      );
    }

    // Validar suscripción origen
    const fromSubscription = await this.stockSubscriptionsService.findOne(
      dto.transferSubscriptionId,
    );
    if (!fromSubscription || fromSubscription.member_id !== dto.memberId) {
      throw new BadRequestException('Suscripción de origen no válida');
    }
    if (Number(fromSubscription.quantity) < dto.transferQuantity) {
      throw new BadRequestException(
        'Cantidad insuficiente en la suscripción de origen',
      );
    }

    // Comentado temporalmente: Validar que no tenga crédito asociado
    // if (fromSubscription.financing_loan_id) {
    //   throw new BadRequestException('No se pueden transferir acciones con crédito asociado');
    // }

    // Obtener acción y socios para trazabilidad
    const stock = await this.findOne(fromSubscription.stock_id);
    const fromMember = await this.membersService.findOne(dto.memberId);
    const toMember = await this.membersService.findOne(dto.toMemberId);
    const transferValue = stock.value * dto.transferQuantity;

    // Crear operación ORIGEN (socio que transfiere)
    const fromOperation = queryRunner.manager.create(Operation, {
      member_id: dto.memberId,
      meeting_id: dto.meetingId,
      description: `Transferencia de ${dto.transferQuantity} ${stock.type} a ${toMember.name}`,
      type: OperationType.STOCK_TRANSFER,
    });
    await queryRunner.manager.save(fromOperation);

    // Crear operación DESTINO (socio que recibe)
    const toOperation = queryRunner.manager.create(Operation, {
      member_id: dto.toMemberId,
      meeting_id: dto.meetingId,
      description: `Recepción de ${dto.transferQuantity} ${stock.type} desde ${fromMember.name}`,
      type: OperationType.STOCK_TRANSFER,
    });
    await queryRunner.manager.save(toOperation);

    // Actualizar suscripción origen
    const newFromQuantity =
      Number(fromSubscription.quantity) - dto.transferQuantity;
    if (newFromQuantity > 0) {
      await queryRunner.manager.update(
        'stock_subscriptions',
        { id: dto.transferSubscriptionId },
        { quantity: newFromQuantity },
      );
    } else {
      await queryRunner.manager.update(
        'stock_subscriptions',
        { id: dto.transferSubscriptionId },
        { quantity: 0 },
      );
    }

    // Crear suscripción destino
    const toSubscription = await this.stockSubscriptionsService.create(
      {
        member_id: dto.toMemberId,
        stock_id: fromSubscription.stock_id,
        quantity: dto.transferQuantity,
        financing_loan_id: null,
      },
      queryRunner,
    );

    // Crear asientos contables para la operación ORIGEN
    const fromLedgerEntries: LedgerEntry[] = [];

    // DÉBITO: Disminuir capital del socio origen
    fromLedgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: fromOperation.id,
        stock_id: fromSubscription.stock_id,
        stock_subscription_id: dto.transferSubscriptionId,
        account_type: STOCK_CAPITAL_ACCOUNT,
        amount: transferValue,
        description: `Transferencia de ${dto.transferQuantity} ${stock.type} a ${toMember.name}`,
      }),
    );

    // CRÉDITO: Aumentar cuenta de transferencia (cuenta puente)
    fromLedgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: fromOperation.id,
        stock_id: fromSubscription.stock_id,
        account_type: STOCK_TRANSFER_ACCOUNT,
        amount: -transferValue,
        description: `Transferencia de ${dto.transferQuantity} ${stock.type} a ${toMember.name}`,
      }),
    );

    // Crear asientos contables para la operación DESTINO
    const toLedgerEntries: LedgerEntry[] = [];

    // DÉBITO: Disminuir cuenta de transferencia (cuenta puente)
    toLedgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: toOperation.id,
        stock_id: fromSubscription.stock_id,
        account_type: STOCK_TRANSFER_ACCOUNT,
        amount: transferValue,
        description: `Transferencia de ${dto.transferQuantity} ${stock.type} desde ${fromMember.name}`,
      }),
    );

    // CRÉDITO: Aumentar capital del socio destino
    toLedgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: toOperation.id,
        stock_id: fromSubscription.stock_id,
        stock_subscription_id: toSubscription.id,
        account_type: STOCK_CAPITAL_ACCOUNT,
        amount: -transferValue,
        description: `Recepción de ${dto.transferQuantity} ${stock.type} desde ${fromMember.name}`,
      }),
    );

    // Guardar todos los asientos contables
    await queryRunner.manager.save([...fromLedgerEntries, ...toLedgerEntries]);
    await queryRunner.commitTransaction();

    return {
      operationId: fromOperation.id, // Retornamos la operación principal (origen)
      message: 'Transferencia de acciones procesada exitosamente',
      details: {
        stockType: stock.type,
        quantity: dto.transferQuantity,
        value: transferValue,
        fromMemberId: dto.memberId,
        fromMemberName: fromMember.name,
        toMemberId: dto.toMemberId,
        toMemberName: toMember.name,
        fromOperationId: fromOperation.id,
        toOperationId: toOperation.id,
      },
    };
  }

  private async processStockLoanPayment(
    queryRunner: QueryRunner,
    dto: StockModificationDto,
  ): Promise<{
    operationId: string;
    message: string;
    details: any;
  }> {
    if (
      !dto.loanPaymentSubscriptionId ||
      !dto.loanPaymentQuantity ||
      !dto.loanId
    ) {
      throw new BadRequestException(
        'Faltan datos requeridos para el pago con acciones',
      );
    }

    // Validar suscripción
    const subscription = await this.stockSubscriptionsService.findOne(
      dto.loanPaymentSubscriptionId,
    );
    if (!subscription || subscription.member_id !== dto.memberId) {
      throw new BadRequestException('Suscripción no válida');
    }
    if (Number(subscription.quantity) < dto.loanPaymentQuantity) {
      throw new BadRequestException('Cantidad insuficiente en la suscripción');
    }

    // Comentado temporalmente: Validar que no tenga crédito asociado
    // if (subscription.financing_loan_id) {
    //   throw new BadRequestException('No se pueden usar acciones con crédito asociado para pagos');
    // }

    // Obtener acción y crédito
    const stock = await this.findOne(subscription.stock_id);
    const loan = await this.loansService.findOne(dto.loanId);

    if (loan.member_id !== dto.memberId) {
      throw new BadRequestException('El crédito no pertenece al socio');
    }

    const paymentValue = stock.value * dto.loanPaymentQuantity;
    const newBalance = Number(loan.outstanding_balance) - paymentValue;

    // Crear operación
    const operation = queryRunner.manager.create(Operation, {
      member_id: dto.memberId,
      meeting_id: dto.meetingId,
      description: `Pago de crédito con ${dto.loanPaymentQuantity} ${stock.type}`,
      type: OperationType.STOCK_LOAN_PAYMENT,
    });
    await queryRunner.manager.save(operation);

    // Actualizar suscripción
    const newQuantity = Number(subscription.quantity) - dto.loanPaymentQuantity;
    if (newQuantity > 0) {
      await queryRunner.manager.update(
        'stock_subscriptions',
        { id: dto.loanPaymentSubscriptionId },
        { quantity: newQuantity },
      );
    } else {
      await queryRunner.manager.update(
        'stock_subscriptions',
        { id: dto.loanPaymentSubscriptionId },
        { quantity: 0 },
      );
    }

    // Actualizar crédito
    await queryRunner.manager.update(
      'loans',
      { id: dto.loanId },
      { outstanding_balance: newBalance },
    );

    // Crear asientos contables
    const ledgerEntries: LedgerEntry[] = [];

    // Disminuir capital de acciones
    ledgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        stock_id: subscription.stock_id,
        stock_subscription_id: dto.loanPaymentSubscriptionId,
        account_type: STOCK_CAPITAL_ACCOUNT,
        amount: paymentValue,
        description: `Pago de crédito con ${dto.loanPaymentQuantity} ${stock.type}`,
      }),
    );

    // Reducir deuda del crédito
    ledgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: LOANS_RECEIVABLE_ACCOUNT,
        amount: -paymentValue,
        description: `Pago de crédito ${loan.loan_type}`,
      }),
    );

    await queryRunner.manager.save(ledgerEntries);

    // Crear registro en loan_transactions_detail para trazabilidad
    const loanTransactionDetail = queryRunner.manager.create(
      LoanTransactionDetail,
      {
        loan_id: dto.loanId,
        transaction_type: TransactionType.PRINCIPAL_PAYMENT,
        amount: paymentValue,
        transaction_date: new Date().toISOString().split('T')[0],
        notes: `Pago con ${dto.loanPaymentQuantity} ${stock.type} (valor: ${paymentValue})`,
        operation_id: operation.id,
      },
    );
    await queryRunner.manager.save(loanTransactionDetail);

    await queryRunner.commitTransaction();

    return {
      operationId: operation.id,
      message: 'Pago de crédito con acciones procesado exitosamente',
      details: {
        stockType: stock.type,
        quantity: dto.loanPaymentQuantity,
        paymentValue,
        loanType: loan.loan_type,
        previousBalance: loan.outstanding_balance,
        newBalance,
        transactionDetailId: loanTransactionDetail.id,
      },
    };
  }

  /**
   * Get stock summary for a specific member using LedgerEntry for transactions
   */
  async getMemberStockSummary(memberId: string): Promise<{
    memberId: string;
    memberName: string;
    stocks: Array<{
      id: string;
      name: string;
      quantity: number;
      value: number;
      nominalValue: number;
      requiredContribution: number;
      lastTransactionDate?: Date;
    }>;
    totalValue: number;
    totalMonthlyContribution: number;
  }> {
    // Get member
    const member = await this.membersService.findOne(memberId);

    // Get stock subscriptions for the member
    const stockSubscriptions = await this.stockSubscriptionsRepository.find({
      where: { member_id: memberId },
      relations: ['stock'],
    });

    // Get stock transactions from LedgerEntry
    const stockTransactions = await this.dataSource
      .getRepository(LedgerEntry)
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.operation', 'operation')
      .leftJoinAndSelect('entry.stock', 'stock')
      .where('entry.member_id = :memberId', { memberId })
      .andWhere('entry.stock_id IS NOT NULL')
      .andWhere('operation.type IN (:...types)', {
        types: [
          OperationType.STOCK_PURCHASE,
          OperationType.STOCK_FEE,
          OperationType.STOCK_WITHDRAWAL,
        ],
      })
      .orderBy('entry.created_at', 'DESC')
      .getMany();

    // Calculate stock values and contributions
    const stocks = stockSubscriptions.map((subscription) => {
      const stock = subscription.stock;
      const quantity = Number(subscription.quantity);
      const value = stock.value * quantity;

      // Find last transaction for this stock
      const lastTransaction = stockTransactions.find(
        (t) => t.stock_id === stock.id,
      );

      return {
        id: stock.id,
        name: stock.type,
        quantity,
        value,
        nominalValue: stock.value,
        requiredContribution: stock.monthly_contribution || 0,
        lastTransactionDate: lastTransaction?.created_at,
      };
    });

    const totalValue = stocks.reduce((sum, stock) => sum + stock.value, 0);
    const totalMonthlyContribution = stocks.reduce(
      (sum, stock) => sum + stock.requiredContribution,
      0,
    );

    return {
      memberId,
      memberName: member.name,
      stocks,
      totalValue,
      totalMonthlyContribution,
    };
  }

  /**
   * Get stock transaction history for a specific stock and member
   */
  async getStockTransactionHistory(
    stockId: string,
    memberId: string,
  ): Promise<{
    stockId: string;
    stockName: string;
    memberId: string;
    memberName: string;
    transactions: Array<{
      id: string;
      date: Date;
      period: string;
      description: string;
      amount: number;
      status: string;
      operationType: string;
    }>;
    totalAmount: number;
  }> {
    // Get member and stock
    const member = await this.membersService.findOne(memberId);
    const stock = await this.findOne(stockId);

    // Get stock transactions from LedgerEntry through stock_subscription relationship
    const transactions = await this.dataSource
      .getRepository(LedgerEntry)
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.operation', 'operation')
      .leftJoinAndSelect('entry.stock_subscription', 'stock_subscription')
      .where('stock_subscription.member_id = :memberId', { memberId })
      .andWhere('stock_subscription.stock_id = :stockId', { stockId })
      .andWhere('operation.type IN (:...types)', {
        types: [
          OperationType.STOCK_FEE,
          OperationType.STOCK_WITHDRAWAL,
          OperationType.STOCK_PURCHASE,
        ],
      })
      .orderBy('entry.created_at', 'DESC')
      .getMany();

    // Map transactions to DTO format
    const transactionDtos = transactions.map((entry) => {
      const date = new Date(entry.created_at);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      return {
        id: entry.id,
        date: entry.created_at,
        period,
        description: entry.description || `Transacción de ${stock.type}`,
        amount: Math.abs(Number(entry.amount)),
        status: entry.amount > 0 ? 'Pagado' : 'Pendiente',
        operationType: entry.operation.type,
      };
    });

    const totalAmount = transactionDtos.reduce((sum, t) => sum + t.amount, 0);

    return {
      stockId,
      stockName: stock.type,
      memberId,
      memberName: member.name,
      transactions: transactionDtos,
      totalAmount,
    };
  }

  /**
   * Get stock operations for a specific member in a specific meeting
   */
  async getStockOperationsForMemberInMeeting(
    memberId: string,
    meetingId: string,
  ): Promise<
    Array<{
      id: string;
      type: string;
      description: string;
      date: Date;
      details: any;
    }>
  > {
    // Validate that member exists
    const member = await this.membersService.findOne(memberId);
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    // Get stock operations from the operations table
    const operations = await this.operationsRepository
      .createQueryBuilder('operation')
      .leftJoinAndSelect('operation.member', 'member')
      .leftJoinAndSelect('operation.meeting', 'meeting')
      .where('operation.member_id = :memberId', { memberId })
      .andWhere('operation.meeting_id = :meetingId', { meetingId })
      .andWhere('operation.type IN (:...types)', {
        types: [
          OperationType.STOCK_MODIFICATION,
          OperationType.STOCK_TRANSFER,
          OperationType.STOCK_LOAN_PAYMENT,
        ],
      })
      .orderBy('operation.date', 'DESC')
      .getMany();

    // Get additional details from ledger entries for each operation
    const operationsWithDetails = await Promise.all(
      operations.map(async (operation) => {
        const ledgerEntries = await this.dataSource
          .getRepository(LedgerEntry)
          .createQueryBuilder('entry')
          .leftJoinAndSelect('entry.stock', 'stock')
          .leftJoinAndSelect('entry.loan', 'loan')
          .where('entry.operation_id = :operationId', {
            operationId: operation.id,
          })
          .getMany();

        // Extract relevant details based on operation type
        let details: any = {};

        switch (operation.type) {
          case OperationType.STOCK_MODIFICATION:
            details = this.extractStockModificationDetails(
              ledgerEntries,
              operation.description,
            );
            break;
          case OperationType.STOCK_TRANSFER:
            details = this.extractStockTransferDetails(
              ledgerEntries,
              operation.description,
            );
            break;
          case OperationType.STOCK_LOAN_PAYMENT:
            details = this.extractStockLoanPaymentDetails(
              ledgerEntries,
              operation.description,
            );
            break;
        }

        return {
          id: operation.id,
          type: operation.type,
          description: operation.description,
          date: operation.date,
          details,
        };
      }),
    );

    return operationsWithDetails;
  }

  /**
   * Get all stock operations for a specific meeting
   */
  async getAllStockOperationsForMeeting(
    meetingId: string,
  ): Promise<
    Array<{
      id: string;
      type: string;
      description: string;
      date: Date;
      details: any;
      memberId: string;
      memberName: string;
    }>
  > {
    // Get all stock operations from the operations table for the meeting
    const operations = await this.operationsRepository
      .createQueryBuilder('operation')
      .leftJoinAndSelect('operation.member', 'member')
      .leftJoinAndSelect('operation.meeting', 'meeting')
      .where('operation.meeting_id = :meetingId', { meetingId })
      .andWhere('operation.type IN (:...types)', {
        types: [
          OperationType.STOCK_MODIFICATION,
          OperationType.STOCK_TRANSFER,
          OperationType.STOCK_LOAN_PAYMENT,
        ],
      })
      .orderBy('operation.date', 'DESC')
      .getMany();

    // Get additional details from ledger entries for each operation
    const operationsWithDetails = await Promise.all(
      operations.map(async (operation) => {
        const ledgerEntries = await this.dataSource
          .getRepository(LedgerEntry)
          .createQueryBuilder('entry')
          .leftJoinAndSelect('entry.stock', 'stock')
          .leftJoinAndSelect('entry.loan', 'loan')
          .where('entry.operation_id = :operationId', {
            operationId: operation.id,
          })
          .getMany();

        // Extract relevant details based on operation type
        let details: any = {};

        switch (operation.type) {
          case OperationType.STOCK_MODIFICATION:
            details = this.extractStockModificationDetails(
              ledgerEntries,
              operation.description,
            );
            break;
          case OperationType.STOCK_TRANSFER:
            details = this.extractStockTransferDetails(
              ledgerEntries,
              operation.description,
            );
            break;
          case OperationType.STOCK_LOAN_PAYMENT:
            details = this.extractStockLoanPaymentDetails(
              ledgerEntries,
              operation.description,
            );
            break;
        }

        return {
          id: operation.id,
          type: operation.type,
          description: operation.description,
          date: operation.date,
          details,
          memberId: operation.member_id,
          memberName: operation.member?.name || 'Unknown',
        };
      }),
    );

    return operationsWithDetails;
  }

  /**
   * Extract details for stock modification operations
   */
  private extractStockModificationDetails(
    ledgerEntries: LedgerEntry[],
    description: string,
  ): any {
    const stockEntries = ledgerEntries.filter((entry) => entry.stock_id);
    const stockCapitalEntries = stockEntries.filter(
      (entry) => entry.account_type === STOCK_CAPITAL_ACCOUNT,
    );

    // Extract stock types and amounts from ledger entries
    const stockDetails = stockCapitalEntries.map((entry) => ({
      stockType: entry.stock?.type || 'Unknown',
      amount: Number(entry.amount),
      description: entry.description,
    }));

    // Try to parse from description if available
    const fromMatch = description.match(
      /Intercambio (\d+) ([^→]+) → (\d+) (.+)/,
    );
    if (fromMatch) {
      return {
        fromQuantity: parseInt(fromMatch[1]),
        fromStockType: fromMatch[2].trim(),
        toQuantity: parseInt(fromMatch[3]),
        toStockType: fromMatch[4].trim(),
        stockDetails,
      };
    }

    return { stockDetails };
  }

  /**
   * Extract details for stock transfer operations
   */
  private extractStockTransferDetails(
    ledgerEntries: LedgerEntry[],
    description: string,
  ): any {
    const stockEntries = ledgerEntries.filter((entry) => entry.stock_id);
    const stockCapitalEntries = stockEntries.filter(
      (entry) => entry.account_type === STOCK_CAPITAL_ACCOUNT,
    );

    const stockDetails = stockCapitalEntries.map((entry) => ({
      stockType: entry.stock?.type || 'Unknown',
      amount: Number(entry.amount),
      description: entry.description,
    }));

    // Try to parse from description if available
    const transferMatch = description.match(
      /Transferencia de (\d+) ([^a]+) a (.+)/,
    );
    const receptionMatch = description.match(
      /Recepción de (\d+) ([^d]+) desde (.+)/,
    );

    if (transferMatch) {
      return {
        quantity: parseInt(transferMatch[1]),
        stockType: transferMatch[2].trim(),
        toMemberName: transferMatch[3].trim(),
        stockDetails,
      };
    } else if (receptionMatch) {
      return {
        quantity: parseInt(receptionMatch[1]),
        stockType: receptionMatch[2].trim(),
        fromMemberName: receptionMatch[3].trim(),
        stockDetails,
      };
    }

    return { stockDetails };
  }

  /**
   * Extract details for stock loan payment operations
   */
  private extractStockLoanPaymentDetails(
    ledgerEntries: LedgerEntry[],
    description: string,
  ): any {
    const stockEntries = ledgerEntries.filter((entry) => entry.stock_id);
    const loanEntries = ledgerEntries.filter((entry) => entry.loan_id);
    const stockCapitalEntries = stockEntries.filter(
      (entry) => entry.account_type === STOCK_CAPITAL_ACCOUNT,
    );
    const loanReceivableEntries = loanEntries.filter(
      (entry) => entry.account_type === LOANS_RECEIVABLE_ACCOUNT,
    );

    const stockDetails = stockCapitalEntries.map((entry) => ({
      stockType: entry.stock?.type || 'Unknown',
      amount: Number(entry.amount),
      description: entry.description,
    }));

    const loanDetails = loanReceivableEntries.map((entry) => ({
      loanType: entry.loan?.loan_type || 'Unknown',
      amount: Number(entry.amount),
      description: entry.description,
    }));

    // Try to parse from description if available
    const paymentMatch = description.match(/Pago de crédito con (\d+) (.+)/);
    if (paymentMatch) {
      return {
        quantity: parseInt(paymentMatch[1]),
        stockType: paymentMatch[2].trim(),
        stockDetails,
        loanDetails,
      };
    }

    return { stockDetails, loanDetails };
  }
}
