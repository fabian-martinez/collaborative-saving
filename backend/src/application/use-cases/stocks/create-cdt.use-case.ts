import { CreateCdtDto } from '@application/dto/stocks/create-cdt.dto';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { OperationType } from '@domain/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '@domain/constants/account-types';

export interface CdtResponseDto {
  stockId: string;
  subscriptionId: string;
  type: string;
  value: number;
  expirationDate: Date;
}

export class CreateCdtUseCase {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(dto: CreateCdtDto): Promise<CdtResponseDto> {
    if (dto.amount <= 0) {
      throw new InvalidRequestError('CDT amount must be greater than 0');
    }
    if (dto.termMonths <= 0) {
      throw new InvalidRequestError('CDT term must be at least 1 month');
    }

    return this.transactionManager.execute(async () => {
      const activeMeeting = await this.meetingRepository.findActive();
      if (!activeMeeting) {
        throw new MeetingNotFoundException();
      }

      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + dto.termMonths);

      // Create unique type name: CDT-MemberId-Timestamp
      const uniqueType = `CDT-${dto.memberId}-${Date.now()}`;

      const stock = Stock.create({
        type: uniqueType,
        value: dto.amount,
        monthlyContribution: 0,
        isGuaranteed: true,
        guaranteedYield: 0.015, // 1.5% interest
        behavior: StockBehavior.CAPITAL_APPRECIATION,
        expirationDate: expirationDate,
      });

      const savedStock = await this.stockRepository.save(stock);

      const subscription = StockSubscription.create({
        memberId: dto.memberId,
        stockId: savedStock.id,
        quantity: 1,
      });

      const savedSubscription =
        await this.stockSubscriptionRepository.save(subscription);

      const operationDescription = `Creación de CDT a ${dto.termMonths} meses`;

      await this.recordOperationUseCase.execute({
        memberId: dto.memberId,
        meetingId: activeMeeting.id,
        type: OperationType.STOCK_PURCHASE,
        description: operationDescription,
        date: new Date(),
        entries: [
          {
            accountType: STOCK_CAPITAL_ACCOUNT,
            amount: -dto.amount, // Credit: increase in capital
            description: operationDescription,
            stockId: savedStock.id,
            stockSubscriptionId: savedSubscription.id,
          },
          {
            accountType: CASH_ACCOUNT,
            amount: dto.amount, // Debit: increase in cash
            description: operationDescription,
          },
        ],
      });

      return {
        stockId: savedStock.id,
        subscriptionId: savedSubscription.id,
        type: savedStock.type,
        value: savedStock.value,
        expirationDate: savedStock.expirationDate!,
      };
    });
  }
}
