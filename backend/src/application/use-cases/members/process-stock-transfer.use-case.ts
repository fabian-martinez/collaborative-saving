import { StockTransferDto } from '@application/dto/members/stock-transfer.dto';
import { StockOperationResponseDto } from '@application/dto/members/stock-operation-response.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { Meeting } from '@domain/entities/meeting.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { OperationType } from '@domain/enums/operation-type.enum';
import { STOCK_CAPITAL_ACCOUNT } from '@domain/constants/account-types';

export class ProcessStockTransferUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    private readonly recordOperationUseCase: RecordOperationUseCase,
  ) {}

  async execute(dto: StockTransferDto): Promise<StockOperationResponseDto> {
    if (dto.memberId === dto.toMemberId) {
      throw new InvalidRequestError(
        'El socio destino debe ser distinto al socio origen',
      );
    }

    const [fromMember, toMember] = await Promise.all([
      this.memberRepository.findById(dto.memberId),
      this.memberRepository.findById(dto.toMemberId),
    ]);

    if (!fromMember) {
      throw new MemberNotFoundException(dto.memberId);
    }

    if (!toMember) {
      throw new MemberNotFoundException(dto.toMemberId);
    }

    const meeting = await this.resolveMeeting(dto.meetingId);
    if (meeting.isClosed()) {
      throw new InvalidRequestError(
        'No se pueden transferir acciones en una reunión cerrada',
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

    if (dto.quantity <= 0) {
      throw new InvalidRequestError(
        'La cantidad a transferir debe ser mayor que cero',
      );
    }

    if (fromSubscription.quantity < dto.quantity) {
      throw new InvalidRequestError(
        'El socio no tiene suficientes acciones para transferir',
      );
    }

    const stock = await this.stockRepository.findById(fromSubscription.stockId);
    if (!stock) {
      throw new StockNotFoundException(fromSubscription.stockId);
    }

    const { subscription: destinationSubscription, isNew } =
      await this.getOrCreateDestinationSubscription(
        dto.toMemberId,
        stock.id,
        meeting,
      );

    const transferValue = stock.value * dto.quantity;
    const updatedOriginQuantity = fromSubscription.quantity - dto.quantity;
    fromSubscription.update({ quantity: updatedOriginQuantity });

    if (isNew) {
      destinationSubscription.update({ quantity: dto.quantity });
    } else {
      destinationSubscription.update({
        quantity: destinationSubscription.quantity + dto.quantity,
      });
    }

    await this.stockSubscriptionRepository.save(fromSubscription);
    await this.stockSubscriptionRepository.save(destinationSubscription);

    const ledgerEntries: RecordOperationDto['entries'] = [
      {
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: transferValue,
        description: `Transferencia de ${dto.quantity} ${stock.type} a ${toMember.name}`,
        stockId: stock.id,
        stockSubscriptionId: fromSubscription.id,
      },
      {
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: -transferValue,
        description: `Recepción de ${dto.quantity} ${stock.type} desde ${fromMember.name}`,
        stockId: stock.id,
        stockSubscriptionId: destinationSubscription.id,
      },
    ];

    const operationResult = await this.recordOperationUseCase.execute({
      memberId: dto.memberId,
      meetingId: meeting.id,
      type: OperationType.STOCK_TRANSFER,
      date: meeting.date,
      description:
        dto.notes ??
        `Transferencia de ${dto.quantity} ${stock.type} a ${toMember.name}`,
      entries: ledgerEntries,
    });

    return {
      operationId: operationResult.operationId,
      message: 'Transferencia de acciones procesada correctamente',
      details: {
        meetingId: meeting.id,
        fromMemberId: dto.memberId,
        toMemberId: dto.toMemberId,
        fromSubscriptionId: fromSubscription.id,
        toSubscriptionId: destinationSubscription.id,
        quantity: dto.quantity,
        value: transferValue,
        isNewSubscription: isNew,
      },
    };
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
      quantity: 0,
      purchaseDate: meeting.date,
    });
    return { subscription: created, isNew: true };
  }
}
