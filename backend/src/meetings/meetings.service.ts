import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { SimplifiedRecordTransactionsDto } from './dto/simplified-record-transactions.dto';
import {
  Operation,
  OperationTypeEnum,
} from '../operations/entities/operation.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '../common/constants/account-types';
import { Meeting } from './entities/meeting.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Member } from '../members/entities/member.entity';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { MemberDue } from '../dues/entities/member-due.entity';
import { BuyStockForMemberDto } from '../stocks/dto/buy-stock-for-member.dto';
import { StocksService } from '../stocks/stocks.service';
import { LoansService } from '../loans/loans.service';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly dataSource: DataSource,
    private readonly paymentStrategyFactory: PaymentStrategyFactory,
    private readonly stocksService: StocksService,
    private readonly loansService: LoansService,
  ) {}

  findAll(): Promise<Meeting[]> {
    return this.meetingRepository.find({
      order: {
        date: 'DESC',
      },
    });
  }

  async findActive(): Promise<Meeting | null> {
    return this.meetingRepository.findOne({
      where: { status: 'active' },
    });
  }

  async findMonthlyPaymentsByMeeting(meetingId: string): Promise<Operation[]> {
    return this.dataSource.manager.getRepository(Operation).find({
      where: {
        meeting_id: meetingId,
        type: 'MONTHLY_PAYMENT',
      },
      relations: ['member', 'ledger_entries'],
    });
  }

  async recordMonthlyPayment(
    recordTransactionsDto: SimplifiedRecordTransactionsDto,
  ): Promise<Operation> {
    const { memberId, payments } = recordTransactionsDto;

    const activeMeeting = await this.meetingRepository.findOne({
      where: { status: 'active' },
    });

    if (!activeMeeting) {
      throw new NotFoundException('No active meeting found.');
    }

    const existingPayment = await this.dataSource.manager
      .getRepository(Operation)
      .findOne({
        where: {
          member_id: memberId,
          meeting_id: activeMeeting.id,
          type: 'MONTHLY_PAYMENT',
        },
      });

    if (existingPayment) {
      throw new BadRequestException(
        'El socio ya ha realizado su pago mensual en esta reunión.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const operation = await this._createOperationForMember(
        queryRunner,
        activeMeeting.id,
        memberId,
        'MONTHLY_PAYMENT',
      );

      const ledgerEntries: LedgerEntry[] = [];
      for (const payment of payments) {
        const entries = await this._processPayment(
          queryRunner,
          operation,
          payment,
        );
        ledgerEntries.push(...entries);
      }
      await queryRunner.manager.save(ledgerEntries);

      await queryRunner.commitTransaction();
      return operation;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error recording transaction', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async _createOperationForMember(
    queryRunner: QueryRunner,
    meetingId: string,
    memberId: string,
    type: OperationTypeEnum | null,
  ): Promise<Operation> {
    if (!type) {
      throw new BadRequestException('Tipo de operación no válido.');
    }
    const member = await this.dataSource.manager.findOne(Member, {
      where: { id: memberId },
    });
    const meeting = await this.dataSource.manager.findOne(Meeting, {
      where: { id: meetingId },
    });
    const operation = queryRunner.manager.create(Operation, {
      meeting_id: meetingId,
      member_id: memberId,
      description: `Registro de transacciones para el socio ${member?.name} en la reunión ${meeting?.date.toLocaleDateString()}.`,
      type,
    });
    await queryRunner.manager.save(operation);
    return operation;
  }

  private async _processPayment(
    queryRunner: QueryRunner,
    operation: Operation,
    payment: MemberDue,
  ): Promise<LedgerEntry[]> {
    const ledgerEntries: LedgerEntry[] = [];
    ledgerEntries.push(
      queryRunner.manager.create(LedgerEntry, {
        operation_id: operation.id,
        account_type: CASH_ACCOUNT,
        amount: payment.amount,
        description: payment.description,
      }),
    );

    const strategy = this.paymentStrategyFactory.getStrategy(payment.type);
    const strategyEntries = await strategy.process(
      queryRunner,
      operation,
      payment,
    );
    ledgerEntries.push(...strategyEntries);

    return ledgerEntries;
  }

  async create(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    const activeMeeting = await this.meetingRepository.findOne({
      where: { status: 'active' },
    });

    if (activeMeeting) {
      throw new BadRequestException(
        'An active meeting already exists. Please close it before creating a new one.',
      );
    }

    const meeting = this.meetingRepository.create(createMeetingDto);
    return this.meetingRepository.save(meeting);
  }

  async close(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOneBy({ id });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found.`);
    }

    if (meeting.status === 'closed') {
      throw new BadRequestException('This meeting is already closed.');
    }

    meeting.status = 'closed';
    return this.meetingRepository.save(meeting);
  }

  async buyStocksForMember(meetingId: string, dto: BuyStockForMemberDto) {
    // 1. Validar que la reunión existe y está activa
    const meeting = await this.meetingRepository.findOneBy({ id: meetingId });
    if (!meeting || meeting.status !== 'active') {
      throw new BadRequestException('La reunión no existe o no está activa.');
    }
    return this.stocksService.purchaseForMember(meetingId, dto);
  }
}
