import { ProcessStockLoanPaymentUseCase } from './process-stock-loan-payment.use-case';
import { StockLoanPaymentDto } from '@application/dto/members/stock-loan-payment.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { Loan } from '@domain/entities/loan.entity';
import { LoanTransactionDetail } from '@domain/entities/loan-transaction-detail.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';

describe('ProcessStockLoanPaymentUseCase', () => {
  let useCase: ProcessStockLoanPaymentUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let loanRepository: jest.Mocked<LoanRepository>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let loanSaveSpy: jest.SpyInstance;
  let loanTransactionSaveSpy: jest.SpyInstance;

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
  const subscription = StockSubscription.create({
    memberId: member.id,
    stockId: stock.id,
    quantity: 5,
    purchaseDate: meeting.date,
  });
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

    loanRepository = {
      findById: jest.fn().mockResolvedValue(loan),
      save: jest
        .fn()
        .mockImplementation((saved: Loan) => Promise.resolve(saved)),
    } as unknown as jest.Mocked<LoanRepository>;

    loanTransactionDetailRepository = {
      save: jest
        .fn()
        .mockImplementation((detail: LoanTransactionDetail) =>
          Promise.resolve(detail),
        ),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

    recordOperationUseCase = {
      execute: jest.fn().mockResolvedValue({
        operationId: 'operation-loan-payment',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      }),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    useCase = new ProcessStockLoanPaymentUseCase(
      memberRepository,
      meetingRepository,
      stockRepository,
      stockSubscriptionRepository,
      loanRepository,
      loanTransactionDetailRepository,
      recordOperationUseCase,
    );

    loanSaveSpy = jest.spyOn(loanRepository, 'save');
    loanTransactionSaveSpy = jest.spyOn(
      loanTransactionDetailRepository,
      'save',
    );
  });

  const baseDto: StockLoanPaymentDto = {
    memberId: member.id,
    meetingId: meeting.id,
    subscriptionId: subscription.id,
    quantity: 2,
    loanId: loan.id,
  };

  it('registra el pago de crédito con acciones', async () => {
    const result = await useCase.execute(baseDto);

    expect(result.operationId).toBe('operation-loan-payment');
    expect(loanSaveSpy).toHaveBeenCalled();
    expect(loanTransactionSaveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId: loan.id,
        amount: stock.value * baseDto.quantity,
      }) as LoanTransactionDetail,
    );
  });

  it('lanza error cuando no hay suficientes acciones', async () => {
    const dto = { ...baseDto, quantity: 20 };
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });

  it('lanza error cuando el crédito no pertenece al socio', async () => {
    loanRepository.findById.mockResolvedValueOnce(
      Loan.create({
        memberId: 'other-member',
        loanType: 'accion',
        approvedAmount: 100000,
        monthlyPaymentAmount: 0,
        interestRate: 0.02,
        term: 12,
      }),
    );

    await expect(useCase.execute(baseDto)).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });
});
