import { ProcessStockExchangeUseCase } from './process-stock-exchange.use-case';
import { StockExchangeDto } from '@application/dto/members/stock-exchange.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Stock, StockBehavior } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import {
  PendingMemberPayment,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';
import { LoanTransactionType } from '@domain/entities/loan-transaction-detail.entity';

describe('ProcessStockExchangeUseCase', () => {
  let useCase: ProcessStockExchangeUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let pendingMemberPaymentRepository: jest.Mocked<PendingMemberPaymentRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let createLoanUseCase: jest.Mocked<CreateLoanUseCase>;
  let recordLoanPaymentUseCase: jest.Mocked<RecordLoanPaymentUseCase>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let loanTransactionDetailRepository: jest.Mocked<LoanTransactionDetailRepository>;
  let recordOperationExecuteSpy: jest.SpyInstance;
  let pendingPaymentSaveSpy: jest.SpyInstance;
  let createLoanExecuteSpy: jest.SpyInstance;
  let recordLoanPaymentExecuteSpy: jest.SpyInstance;

  const member = Member.create({
    name: 'Alice',
    email: 'alice@example.com',
    identificationNumber: '123',
  });
  const meeting = Meeting.create({ date: new Date('2024-08-01') });
  const originStock = Stock.create({
    name: 'Grande',
    value: 1000000,
    monthlyContribution: 50000,
    stockTypeId: '1',
  });
  const destinationStock = Stock.create({
    name: 'Super',
    value: 800000,
    monthlyContribution: 40000,
    stockTypeId: '1',
  });
  let originSubscription: StockSubscription;

  beforeEach(() => {
    // Create fresh subscription for each test
    originSubscription = StockSubscription.create({
      memberId: member.id,
      stockId: originStock.id,
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

    recordOperationUseCase = {
      execute: jest.fn().mockResolvedValue({
        operationId: 'operation-1',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      }),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    createLoanUseCase = {
      execute: jest.fn().mockResolvedValue({
        loanId: 'loan-1',
        operationId: 'loan-operation-1',
        status: 'ACTIVE',
      }),
    } as unknown as jest.Mocked<CreateLoanUseCase>;

    recordLoanPaymentUseCase = {
      execute: jest.fn().mockResolvedValue({
        loanId: 'loan-1',
        operationId: 'payment-operation-1',
        interestPaid: 0,
        principalPaid: 200000,
        newOutstandingBalance: 800000,
        loanStatus: 'ACTIVE',
        transactionDetailIds: ['detail-1'],
      }),
    } as unknown as jest.Mocked<RecordLoanPaymentUseCase>;

    transactionManager = {
      execute: jest.fn().mockImplementation((cb: () => Promise<any>) => cb()),
    } as unknown as jest.Mocked<TransactionManager>;

    loanTransactionDetailRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<LoanTransactionDetailRepository>;

    useCase = new ProcessStockExchangeUseCase(
      memberRepository,
      meetingRepository,
      stockRepository,
      stockSubscriptionRepository,
      pendingMemberPaymentRepository,
      recordOperationUseCase,
      createLoanUseCase,
      recordLoanPaymentUseCase,
      transactionManager,
      loanTransactionDetailRepository,
    );

    recordOperationExecuteSpy = jest.spyOn(recordOperationUseCase, 'execute');
    pendingPaymentSaveSpy = jest.spyOn(pendingMemberPaymentRepository, 'save');
    createLoanExecuteSpy = jest.spyOn(createLoanUseCase, 'execute');
    recordLoanPaymentExecuteSpy = jest.spyOn(
      recordLoanPaymentUseCase,
      'execute',
    );
  });

  const createBaseDto = (): StockExchangeDto => ({
    memberId: member.id,
    meetingId: meeting.id,
    fromSubscriptionId: originSubscription.id,
    fromQuantity: 1,
    toStockId: destinationStock.id,
    toQuantity: 1,
  });

  it('procesa un intercambio sin diferencia', async () => {
    const dto = { ...createBaseDto(), toStockId: originStock.id };
    const result = await useCase.execute(dto);

    expect(result.operationId).toBe('operation-1');
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ accountType: STOCK_CAPITAL_ACCOUNT }),
        ]) as unknown as Array<Record<string, any>>,
      }),
    );
  });

  it('crea un PendingMemberPayment cuando la diferencia es a favor del socio (cash)', async () => {
    const dto: StockExchangeDto = {
      ...createBaseDto(),
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
        ]) as unknown as Array<Record<string, any>>,
      }),
    );
  });

  it('abona la diferencia a un crédito existente cuando differenceHandling es credit', async () => {
    const loanId = 'existing-loan-id';

    const dto: StockExchangeDto = {
      ...createBaseDto(),
      fromQuantity: 2, // 2 x 1,000,000 = 2,000,000 (value to give)
      toQuantity: 1, // 1 x 800,000 = 800,000 (value to receive)
      differenceHandling: 'credit',
      targetLoanId: loanId,
    };
    // difference = 2,000,000 - 800,000 = 1,200,000 (positive, member has value to apply to loan)

    const result = await useCase.execute(dto);

    expect(result.details.loan).toBeDefined();
    // Payment delegated to RecordLoanPaymentUseCase
    expect(recordLoanPaymentExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId,
        meetingId: meeting.id,
        totalPaymentAmount: 1200000, // difference
        forcedInterestAmount: 0,
        forcedPrincipalAmount: 1200000,
      }),
    );
    // Stock modification operation should include CASH_ACCOUNT entry for balance
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({
            accountType: CASH_ACCOUNT,
            amount: -1200000, // negative = credit (money going out conceptually)
          }),
        ]) as unknown as Array<Record<string, any>>,
      }),
    );
  });

  it('crea un nuevo crédito cuando la diferencia es en contra y se solicita crédito', async () => {
    const dto: StockExchangeDto = {
      ...createBaseDto(),
      fromQuantity: 1, // 1 x 1,000,000 = 1,000,000 (value to give)
      toQuantity: 2, // 2 x 800,000 = 1,600,000 (value to receive)
      differenceHandling: 'credit',
      targetLoanId: 'new_action_loan',
    };
    // difference = 1,000,000 - 1,600,000 = -600,000 (negative, member needs financing)

    const result = await useCase.execute(dto);

    expect(result.details.loan).toBeDefined();
    // Loan creation delegated to CreateLoanUseCase
    expect(createLoanExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: member.id,
        meetingId: meeting.id,
        loanType: 'accion',
        approvedAmount: 600000, // absolute difference
        disbursedAmount: 600000,
      }),
    );
    // Stock modification operation should include LOANS_RECEIVABLE_ACCOUNT entry (financing)
    expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({
            accountType: LOANS_RECEIVABLE_ACCOUNT,
            amount: 600000, // positive = debit (asset increase)
            loanId: expect.any(String) as string,
          }),
        ]) as unknown as Array<Record<string, any>>,
      }),
    );
  });

  it('ejecuta la lógica dentro de una transacción', async () => {
    const dto = { ...createBaseDto(), toStockId: originStock.id };
    const transactionSpy = jest.spyOn(transactionManager, 'execute');
    
    await useCase.execute(dto);

    expect(transactionSpy).toHaveBeenCalled();
  });

  it('registra el detalle de la transacción del préstamo al crear un crédito', async () => {
    const dto: StockExchangeDto = {
      ...createBaseDto(),
      fromQuantity: 1, 
      toQuantity: 2, 
      differenceHandling: 'credit',
      targetLoanId: 'new_action_loan',
    };

    await useCase.execute(dto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(loanTransactionDetailRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.DISBURSEMENT,
        amount: 600000,
        operationId: 'operation-1',
      }),
    );
  });

  it('lanza error si la suscripción no tiene acciones suficientes', async () => {
    const dto: StockExchangeDto = {
      ...createBaseDto(),
      fromQuantity: 10,
    };

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });
});
