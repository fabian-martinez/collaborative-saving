import { ProcessStockTransferUseCase } from './process-stock-transfer.use-case';
import { StockTransferDto } from '@application/dto/members/stock-transfer.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('ProcessStockTransferUseCase', () => {
  let useCase: ProcessStockTransferUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let recordOperationExecuteSpy: jest.SpyInstance;

  const fromMember = Member.create({
    name: 'Alice',
    email: 'alice@example.com',
    identificationNumber: '123',
  });
  const toMember = Member.create({
    name: 'Bob',
    email: 'bob@example.com',
    identificationNumber: '456',
  });
  const meeting = Meeting.create({ date: new Date('2024-08-01') });
  const stock = Stock.create({
    type: 'Acción Mediana',
    value: 500000,
    monthlyContribution: 25000,
    behavior: StockBehavior.CAPITAL_APPRECIATION,
  });
  const fromSubscription = StockSubscription.create({
    memberId: fromMember.id,
    stockId: stock.id,
    quantity: 5,
    purchaseDate: meeting.date,
  });

  beforeEach(() => {
    memberRepository = {
      findById: jest
        .fn()
        .mockImplementation((id: string) =>
          id === fromMember.id
            ? fromMember
            : id === toMember.id
              ? toMember
              : null,
        ),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    meetingRepository = {
      findById: jest.fn().mockResolvedValue(meeting),
      findActive: jest.fn().mockResolvedValue(meeting),
    } as unknown as jest.Mocked<MeetingRepository>;

    stockRepository = {
      findById: jest.fn().mockResolvedValue(stock),
    } as unknown as jest.Mocked<StockRepository>;

    const destinationSubscription = StockSubscription.create({
      memberId: toMember.id,
      stockId: stock.id,
      quantity: 0,
      purchaseDate: meeting.date,
    });

    stockSubscriptionRepository = {
      findById: jest.fn().mockResolvedValue(fromSubscription),
      findByMemberAndStock: jest
        .fn()
        .mockResolvedValue(destinationSubscription),
      save: jest
        .fn()
        .mockImplementation((subscription: StockSubscription) =>
          Promise.resolve(subscription),
        ),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    recordOperationUseCase = {
      execute: jest.fn().mockResolvedValue({
        operationId: 'operation-transfer',
        ledgerEntryIds: [],
      }),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new ProcessStockTransferUseCase(
      memberRepository,
      meetingRepository,
      stockRepository,
      stockSubscriptionRepository,
      recordOperationUseCase,
    );

    recordOperationExecuteSpy = jest.spyOn(recordOperationUseCase, 'execute');
  });

  const baseDto: StockTransferDto = {
    memberId: fromMember.id,
    meetingId: meeting.id,
    fromSubscriptionId: fromSubscription.id,
    quantity: 2,
    toMemberId: toMember.id,
  };

  it('transfiere acciones exitosamente', async () => {
    const result = await useCase.execute(baseDto);

    expect(result.operationId).toBe('operation-transfer');
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({
            stockSubscriptionId: fromSubscription.id,
          }),
        ]),
      }),
    );
  });

  it('lanza error cuando el socio destino es el mismo que el origen', async () => {
    const dto = { ...baseDto, toMemberId: fromMember.id };
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });

  it('lanza error cuando no hay acciones suficientes', async () => {
    const dto = { ...baseDto, quantity: 100 };
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });
});
