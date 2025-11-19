import { ProcessStockExchangeUseCase } from './process-stock-exchange.use-case';
import { StockExchangeDto } from '@application/dto/members/stock-exchange.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { Loan } from '@domain/entities/loan.entity';
import { LoanTransactionDetail } from '@domain/entities/loan-transaction-detail.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import {
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
} from '@domain/constants/account-types';

describe('ProcessStockExchangeUseCase', () => {
  let useCase: ProcessStockExchangeUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let recordOperationExecuteSpy: jest.SpyInstance;
  let pendingPaymentSaveSpy: jest.SpyInstance;
  let loanSaveSpy: jest.SpyInstance;
  let loanTransactionSaveSpy: jest.SpyInstance;

  const member = Member.create({
    name: 'Alice',
    email: 'alice@example.com',
    identificationNumber: '123',
  });
  const meeting = Meeting.create({ date: new Date('2024-08-01') });
  const originStock = Stock.create({
    type: 'Grande',
    value: 1000000,
    monthlyContribution: 50000,
    behavior: StockBehavior.CAPITAL_APPRECIATION,
  });
  const destinationStock = Stock.create({
    type: 'Super',
    value: 800000,
    monthlyContribution: 40000,
    behavior: StockBehavior.CAPITAL_APPRECIATION,
  });
  const originSubscription = StockSubscription.create({
    memberId: member.id,
    stockId: originStock.id,
    quantity: 5,
    purchaseDate: meeting.date,
  });

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn().mockResolvedValue(member),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    meetingRepository = {
      findById: jest.fn().mockResolvedValue(meeting),
      findActive: jest.fn().mockResolvedValue(meeting),
    } as unknown as jest.Mocked<MeetingRepository>;

    stockRepository = {
      findById: jest
        .fn()
        .mockImplementation((id: string) =>
          id === originStock.id ? originStock : destinationStock,
        ),
    } as unknown as jest.Mocked<StockRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn().mockResolvedValue(originSubscription),
      findByMemberAndStock: jest.fn().mockResolvedValue(null),
      save: jest
        .fn()
        .mockImplementation(async (subscription: StockSubscription) =>
          Promise.resolve(subscription),
        ),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    pendingMemberPaymentRepository = {
      save: jest.fn().mockImplementation((payment: PendingMemberPayment) => {
        return Promise.resolve(payment);
      }),
    } as unknown as jest.Mocked<PendingMemberPaymentRepository>;

    loanRepository = {
      findById: jest.fn(),
      save: jest
        .fn()
        .mockImplementation(async (loan: Loan) => Promise.resolve(loan)),
    } as unknown as jest.Mocked<LoanRepository>;

    loanTransactionDetailRepository = {
      save: jest
        .fn()
        .mockImplementation(async (detail: LoanTransactionDetail) =>
          Promise.resolve(detail),
        ),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

    recordOperationUseCase = {
      execute: jest.fn().mockResolvedValue({
        operationId: 'operation-1',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      }),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new ProcessStockExchangeUseCase(
      memberRepository,
      meetingRepository,
      stockRepository,
      stockSubscriptionRepository,
      pendingMemberPaymentRepository,
      loanRepository,
      loanTransactionDetailRepository,
      recordOperationUseCase,
    );

    recordOperationExecuteSpy = jest.spyOn(recordOperationUseCase, 'execute');
    pendingPaymentSaveSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
    loanSaveSpy = jest.spyOn(loanRepository, 'save');
    loanTransactionSaveSpy = jest.spyOn(
      loanTransactionDetailRepository,
      'save',
    );
  });

  const baseDto: StockExchangeDto = {
    memberId: member.id,
    meetingId: meeting.id,
    fromSubscriptionId: originSubscription.id,
    fromQuantity: 1,
    toStockId: destinationStock.id,
    toQuantity: 1,
  };

  it('procesa un intercambio sin diferencia', async () => {
    const dto = { ...baseDto, toStockId: originStock.id };
    const result = await useCase.execute(dto);

    expect(result.operationId).toBe('operation-1');
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ accountType: STOCK_CAPITAL_ACCOUNT }),
        ]) as unknown as Array<{ accountType: string }>,
      }),
    );
  });

  it('crea un PendingMemberPayment cuando la diferencia es a favor del socio (cash)', async () => {
    const dto: StockExchangeDto = {
      ...baseDto,
      fromQuantity: 2,
      toQuantity: 1,
      differenceHandling: 'cash',
    };

    const result = await useCase.execute(dto);

    expect(result.details.pendingPaymentId).toBeDefined();
    expect(pendingPaymentSaveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PendingMemberPaymentType.STOCK_WITHDRAWAL,
        amount: expect.any(Number) as number,
      }),
    );
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ accountType: CASH_ACCOUNT }),
        ]) as unknown as Array<{ accountType: string }>,
      }),
    );
  });

  it('abona la diferencia a un crédito existente cuando differenceHandling es credit', async () => {
    const loan = Loan.create({
      memberId: member.id,
      loanType: 'accion',
      approvedAmount: 500000,
      monthlyPaymentAmount: 0,
      interestRate: 0.02,
      term: 12,
    });
    loan.update({ outstandingBalance: 500000 });

    loanRepository.findById.mockResolvedValue(loan);

    const dto: StockExchangeDto = {
      ...baseDto,
      fromQuantity: 1,
      toQuantity: 1,
      differenceHandling: 'credit',
      targetLoanId: loan.id,
    };

    const result = await useCase.execute(dto);

    expect(result.details.loan).toBeDefined();
    expect(loanSaveSpy).toHaveBeenCalledWith(loan);
    expect(loanTransactionSaveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId: loan.id,
        amount: expect.any(Number) as number,
      }),
    );
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({
            accountType: LOANS_RECEIVABLE_ACCOUNT,
            amount: expect.any(Number) as number,
          }),
        ]) as unknown as Array<{ accountType: string; amount: number }>,
      }),
    );
  });

  it('crea un nuevo crédito cuando la diferencia es en contra y se solicita crédito', async () => {
    const dto: StockExchangeDto = {
      ...baseDto,
      fromQuantity: 1,
      toQuantity: 2,
      differenceHandling: 'credit',
      targetLoanId: 'new_action_loan',
    };

    const result = await useCase.execute(dto);

    expect(result.details.loan).toBeDefined();
    expect(loanSaveSpy).toHaveBeenCalled();
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({
            accountType: LOANS_RECEIVABLE_ACCOUNT,
            amount: expect.any(Number) as number,
          }),
        ]) as unknown as Array<{ accountType: string; amount: number }>,
      }),
    );
  });

  it('lanza error si la suscripción no tiene acciones suficientes', async () => {
    const dto: StockExchangeDto = {
      ...baseDto,
      fromQuantity: 10,
    };

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });
});
