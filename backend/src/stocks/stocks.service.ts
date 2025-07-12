import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { OperationsService } from '../operations/operations.service';
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
} from '../common/constants/account-types';
import { StockSubscription } from 'src/stock-subscriptions/entities/stock-subscription.entity';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock)
    private readonly stocksRepository: Repository<Stock>,
    @InjectRepository(StockSubscription)
    private readonly stockSubscriptionsRepository: Repository<StockSubscription>,
    private readonly dataSource: DataSource,
    private readonly operationsService: OperationsService,
    private readonly membersService: MembersService,
    private readonly loansService: LoansService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
  ) {}

  create(createStockDto: CreateStockDto): Promise<Stock> {
    const stock = this.stocksRepository.create(createStockDto);
    return this.stocksRepository.save(stock);
  }

  findAll(withDeleted = false): Promise<Stock[]> {
    return this.stocksRepository.find({
      withDeleted: withDeleted,
    });
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
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException(
        'La cantidad de acciones debe ser un entero positivo.',
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
        type: 'STOCK_PURCHASE',
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
}
