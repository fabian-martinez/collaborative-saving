import { ProcessStockLoanPaymentUseCase } from './process-stock-loan-payment.use-case';
import { StockLoanPaymentDto } from '@application/dto/members/stock-loan-payment.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Loan } from '@domain/entities/loan.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';

describe('ProcessStockLoanPaymentUseCase', () => {
  let useCase: ProcessStockLoanPaymentUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let recordLoanPaymentUseCase: jest.Mocked<RecordLoanPaymentUseCase>;
  let recordLoanPaymentExecuteSpy: jest.SpyInstance;

  const member = Member.create({
    name: 'Alice',
    email: 'alice@example.com',
    identificationNumber: '123',
  });
  const meeting = Meeting.create({ date: new Date('2024-08-01') });
  const stock = Stock.create({
    type: 'Acción Corriente',
    value: 300000,
    monthlyContribution: 15000,
    behavior: StockBehavior.CAPITAL_APPRECIATION,
  });
  let subscription: StockSubscription;
  const loan = Loan.create({
    memberId: member.id,
    loanType: 'accion',
    approvedAmount: 1000000,
    monthlyPaymentAmount: 0,
    interestRate: 0.02,
    term: 24,
  });
  loan.update({ outstandingBalance: 800000 });

  beforeEach(() => {
    // Create fresh subscription for each test
    subscription = StockSubscription.create({
      memberId: member.id,
      stockId: stock.id,
      quantity: 5,
      purchaseDate: meeting.date,
    });
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
      findById: jest.fn().mockResolvedValue(stock),
    } as unknown as jest.Mocked<StockRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn().mockResolvedValue(subscription),
      save: jest
        .fn()
        .mockImplementation((sub: StockSubscription) => Promise.resolve(sub)),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    recordOperationUseCase = {
      execute: jest.fn().mockResolvedValue({
        operationId: 'stock-conversion-operation',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      }),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    recordLoanPaymentUseCase = {
      execute: jest.fn().mockResolvedValue({
        loanId: loan.id,
        operationId: 'loan-payment-operation',
        interestPaid: 0,
        principalPaid: 600000, // 2 x 300000
        newOutstandingBalance: 200000, // 800000 - 600000
        loanStatus: 'ACTIVE',
        transactionDetailIds: ['detail-1'],
      }),
    } as unknown as jest.Mocked<RecordLoanPaymentUseCase>;

    useCase = new ProcessStockLoanPaymentUseCase(
      memberRepository,
      meetingRepository,
      stockRepository,
      stockSubscriptionRepository,
      recordLoanPaymentUseCase,
    );

    recordLoanPaymentExecuteSpy = jest.spyOn(
      recordLoanPaymentUseCase,
      'execute',
    );
  });

  const createBaseDto = (): StockLoanPaymentDto => ({
    memberId: member.id,
    meetingId: meeting.id,
    subscriptionId: subscription.id,
    quantity: 2,
    loanId: loan.id,
  });

  it('registra el pago de crédito con acciones', async () => {
    const baseDto = createBaseDto();
    const result = await useCase.execute(baseDto);

    // Operation ID should come from RecordLoanPaymentUseCase
    expect(result.operationId).toBe('loan-payment-operation');

    // Loan payment should be delegated to RecordLoanPaymentUseCase with stock paymentMethod
    expect(recordLoanPaymentExecuteSpy).toHaveBeenCalledWith({
      loanId: loan.id,
      meetingId: meeting.id,
      totalPaymentAmount: stock.value * baseDto.quantity, // 600000
      forcedInterestAmount: 0,
      forcedPrincipalAmount: stock.value * baseDto.quantity, // 600000
      paymentMethod: 'stock',
      sourceAccount: 'STOCK_CAPITAL',
      stockId: stock.id,
      stockSubscriptionId: subscription.id,
      date: meeting.date,
      notes: expect.any(String) as string,
    });

    // Verify result contains loan payment info
    expect(result.details.loanId).toBe(loan.id);
    expect(result.details.loanBalance).toBe(200000);
    expect(result.details.loanOperationId).toBe('loan-payment-operation');
  });

  it('lanza error cuando no hay suficientes acciones', async () => {
    const dto = { ...createBaseDto(), quantity: 20 };
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });

  it('lanza error cuando el crédito no existe', async () => {
    // Mock RecordLoanPaymentUseCase to throw LoanNotFoundException
    recordLoanPaymentExecuteSpy.mockRejectedValueOnce(
      new LoanNotFoundException('non-existent-loan'),
    );

    const dto = { ...createBaseDto(), loanId: 'non-existent-loan' };
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      LoanNotFoundException,
    );
  });

  it('updates stock subscription quantity after payment', async () => {
    const subscriptionSaveSpy = jest.spyOn(stockSubscriptionRepository, 'save');
    const baseDto = createBaseDto();

    await useCase.execute(baseDto);

    // Subscription should be saved with reduced quantity
    expect(subscriptionSaveSpy).toHaveBeenCalled();
    // Original quantity was 5, used 2, so should be 3
    const savedSubscription = subscriptionSaveSpy.mock.calls[0][0];
    expect(savedSubscription.quantity).toBe(3);
  });

  it('delegates loan payment with stock payment method and does not create virtual cash conversion', async () => {
    const recordOperationSpy = jest.spyOn(recordOperationUseCase, 'execute');
    const baseDto = createBaseDto();

    await useCase.execute(baseDto);

    // Should NOT call recordOperation directly (no virtual cash bridge)
    expect(recordOperationSpy).not.toHaveBeenCalled();

    // Should delegate to RecordLoanPaymentUseCase with stock parameters
    expect(recordLoanPaymentExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: 'stock',
        sourceAccount: 'STOCK_CAPITAL',
        stockId: stock.id,
        stockSubscriptionId: subscription.id,
        date: meeting.date,
        totalPaymentAmount: 600000,
        forcedPrincipalAmount: 600000,
        forcedInterestAmount: 0,
      }),
    );
  });
});
