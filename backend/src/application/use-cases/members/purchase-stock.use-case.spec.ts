import { PurchaseStockUseCase } from './purchase-stock.use-case';
import { PurchaseStockDto } from '@application/dto/members/purchase-stock.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { TransactionManager } from '@domain/ports/services/transaction-manager.port';
import { CreateLoanUseCase } from '@application/use-cases/loans/create-loan.use-case';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { Stock } from '@domain/entities/stock.entity';
import { StockSubscription } from '@domain/entities/stock-subscription.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { OperationType } from '@domain/enums/operation-type.enum';
import { StockBehavior } from '@domain/entities/stock.entity';
import {
  STOCK_CAPITAL_ACCOUNT,
  CASH_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '@domain/constants/account-types';

describe('PurchaseStockUseCase', () => {
  let useCase: PurchaseStockUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let stockRepository: jest.Mocked<StockRepository>;
  let stockSubscriptionRepository: jest.Mocked<StockSubscriptionRepository>;
  let createLoanUseCase: jest.Mocked<CreateLoanUseCase>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let transactionManager: jest.Mocked<TransactionManager>;

  let memberFindByIdSpy: jest.SpyInstance;
  let meetingFindByIdSpy: jest.SpyInstance;
  let meetingFindActiveSpy: jest.SpyInstance;
  let stockFindByIdSpy: jest.SpyInstance;
  let stockSubscriptionSaveSpy: jest.SpyInstance;
  let createLoanExecuteSpy: jest.SpyInstance;
  let recordOperationExecuteSpy: jest.SpyInstance;

  const mockMemberId = 'member-id-1';
  const mockMeetingId = 'meeting-id-1';
  const mockStockId = 'stock-id-1';
  const mockMember = Member.create({
    name: 'John Doe',
    email: 'john.doe@example.com',
    identificationNumber: '1234567890',
  });
  const mockMeeting = Meeting.create({
    date: new Date('2024-01-15'),
    notes: 'Test meeting',
  });
  const mockStock = Stock.create({
    type: 'Acción A',
    value: 100000,
    monthlyContribution: 50000,
    isGuaranteed: true,
    guaranteedYield: 0.05,
    behavior: StockBehavior.CAPITAL_APPRECIATION,
  });

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    };

    stockRepository = {
      findById: jest.fn(),
      findByType: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<StockRepository>;

    stockSubscriptionRepository = {
      findById: jest.fn(),
      findByMember: jest.fn(),
      findByStock: jest.fn(),
      findByMemberAndStockAndNoLoan: jest.fn(),
      findByFinancingLoan: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    } as unknown as jest.Mocked<StockSubscriptionRepository>;

    createLoanUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateLoanUseCase>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    transactionManager = {
      execute: jest.fn(async <T>(operation: () => Promise<T>): Promise<T> => {
        return await operation();
      }),
      getActiveQueryRunner: jest.fn(),
    } as unknown as jest.Mocked<TransactionManager>;

    useCase = new PurchaseStockUseCase(
      memberRepository,
      meetingRepository,
      stockRepository,
      stockSubscriptionRepository,
      createLoanUseCase,
      recordOperationUseCase,
      transactionManager,
    );

    // Setup default mocks
    memberFindByIdSpy = jest
      .spyOn(memberRepository, 'findById')
      .mockResolvedValue(mockMember);
    meetingFindByIdSpy = jest
      .spyOn(meetingRepository, 'findById')
      .mockResolvedValue(mockMeeting);
    meetingFindActiveSpy = jest
      .spyOn(meetingRepository, 'findActive')
      .mockResolvedValue(mockMeeting);
    stockFindByIdSpy = jest
      .spyOn(stockRepository, 'findById')
      .mockResolvedValue(mockStock);
    recordOperationExecuteSpy = jest
      .spyOn(recordOperationUseCase, 'execute')
      .mockResolvedValue({
        operationId: 'operation-id-1',
        ledgerEntryIds: ['ledger-entry-1', 'ledger-entry-2'],
      });
    stockSubscriptionSaveSpy = jest.spyOn(stockSubscriptionRepository, 'save');
    createLoanExecuteSpy = jest.spyOn(createLoanUseCase, 'execute');
  });

  describe('Successful stock purchase', () => {
    it('should purchase stocks with full cash payment successfully', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 2,
        cashAmount: 200000, // Full payment: 2 * 100000
      };

      const savedStockSubscription = StockSubscription.create({
        memberId: dto.memberId,
        stockId: dto.stockId,
        quantity: dto.quantity,
        purchaseDate: mockMeeting.date,
      });

      stockSubscriptionSaveSpy.mockResolvedValue(savedStockSubscription);

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        operationId: 'operation-id-1',
        meetingId: mockMeeting.id,
        memberId: mockMemberId,
        stockSubscriptionId: savedStockSubscription.id,
        loanId: null,
      });

      expect(memberFindByIdSpy).toHaveBeenCalledWith(mockMemberId);
      expect(stockFindByIdSpy).toHaveBeenCalledWith(mockStockId);
      expect(stockSubscriptionSaveSpy).toHaveBeenCalled();
      expect(createLoanExecuteSpy).not.toHaveBeenCalled();
      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: mockMemberId,
          meetingId: mockMeeting.id,
          type: OperationType.STOCK_PURCHASE,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: STOCK_CAPITAL_ACCOUNT,
              amount: -200000,
              stockId: mockStockId,
              stockSubscriptionId: savedStockSubscription.id,
            }),
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: 200000,
            }),
          ]),
        }),
      );
    });

    it('should purchase stocks with loan financing successfully', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 2,
        cashAmount: 0, // No cash payment
        loanDetails: {
          interest_rate: 0.02,
          loan_type: 'accion',
        },
      };

      const savedStockSubscription = StockSubscription.create({
        memberId: dto.memberId,
        stockId: dto.stockId,
        quantity: dto.quantity,
        purchaseDate: mockMeeting.date,
        financingLoanId: 'loan-id-1',
      });

      stockSubscriptionSaveSpy.mockResolvedValue(savedStockSubscription);
      createLoanExecuteSpy.mockResolvedValue({
        loanId: 'loan-id-1',
        operationId: 'loan-operation-id-1',
        status: 'active',
      });

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        operationId: 'operation-id-1',
        meetingId: mockMeeting.id,
        memberId: mockMemberId,
        stockSubscriptionId: savedStockSubscription.id,
        loanId: 'loan-id-1',
      });

      expect(createLoanExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: mockMemberId,
          meetingId: mockMeeting.id,
          loanType: 'accion',
          approvedAmount: 200000, // 2 * 100000
          monthlyPaymentAmount: 0,
          interestRate: 0.02,
          term: 24,
        }),
      );
      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: STOCK_CAPITAL_ACCOUNT,
              amount: -200000,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: 200000,
              loanId: 'loan-id-1',
            }),
          ]),
        }),
      );
    });

    it('should purchase stocks with partial payment (cash + loan) successfully', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 2,
        cashAmount: 100000, // Partial payment: 50%
        loanDetails: {
          interest_rate: 0.02,
          loan_type: 'accion',
        },
      };

      const savedStockSubscription = StockSubscription.create({
        memberId: dto.memberId,
        stockId: dto.stockId,
        quantity: dto.quantity,
        purchaseDate: mockMeeting.date,
        financingLoanId: 'loan-id-1',
      });

      stockSubscriptionSaveSpy.mockResolvedValue(savedStockSubscription);
      createLoanExecuteSpy.mockResolvedValue({
        loanId: 'loan-id-1',
        operationId: 'loan-operation-id-1',
        status: 'active',
      });

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        operationId: 'operation-id-1',
        meetingId: mockMeeting.id,
        memberId: mockMemberId,
        stockSubscriptionId: savedStockSubscription.id,
        loanId: 'loan-id-1',
      });

      expect(createLoanExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAmount: 100000, // 200000 - 100000
        }),
      );
      expect(recordOperationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entries: expect.arrayContaining([
            expect.objectContaining({
              accountType: STOCK_CAPITAL_ACCOUNT,
              amount: -200000,
            }),
            expect.objectContaining({
              accountType: CASH_ACCOUNT,
              amount: 100000,
            }),
            expect.objectContaining({
              accountType: LOANS_RECEIVABLE_ACCOUNT,
              amount: 100000,
              loanId: 'loan-id-1',
            }),
          ]),
        }),
      );
    });

    it('should use active meeting when meetingId is not provided', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 1,
        cashAmount: 100000,
      };

      const savedStockSubscription = StockSubscription.create({
        memberId: dto.memberId,
        stockId: dto.stockId,
        quantity: dto.quantity,
        purchaseDate: mockMeeting.date,
      });

      stockSubscriptionSaveSpy.mockResolvedValue(savedStockSubscription);
      meetingFindByIdSpy.mockClear();

      await useCase.execute(dto);

      expect(meetingFindByIdSpy).not.toHaveBeenCalled();
      expect(meetingFindActiveSpy).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should throw MemberNotFoundException when member does not exist', async () => {
      const dto: PurchaseStockDto = {
        memberId: 'non-existent-member',
        stockId: mockStockId,
        quantity: 1,
        cashAmount: 100000,
      };

      memberFindByIdSpy.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        MemberNotFoundException,
      );
    });

    it('should throw StockNotFoundException when stock does not exist', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: 'non-existent-stock',
        quantity: 1,
        cashAmount: 100000,
      };

      stockFindByIdSpy.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        StockNotFoundException,
      );
    });

    it('should throw MeetingNotFoundException when meeting does not exist and no active meeting', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 1,
        cashAmount: 100000,
        meetingId: 'non-existent-meeting',
      };

      meetingFindByIdSpy.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        MeetingNotFoundException,
      );
    });

    it('should throw MeetingNotFoundException when no active meeting exists and no meetingId provided', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 1,
        cashAmount: 100000,
      };

      meetingFindActiveSpy.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        MeetingNotFoundException,
      );
    });

    it('should throw InvalidRequestError when meeting is closed', async () => {
      const closedMeeting = Meeting.create({
        date: new Date('2024-01-15'),
        notes: 'Closed meeting',
      });
      closedMeeting.close();

      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 1,
        cashAmount: 100000,
        meetingId: mockMeetingId,
      };

      meetingFindByIdSpy.mockResolvedValue(closedMeeting);

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when quantity is zero or negative', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 0,
        cashAmount: 100000,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when cashAmount is negative', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 1,
        cashAmount: -1000,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when cashAmount exceeds total value', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 1,
        cashAmount: 200000, // Exceeds 1 * 100000
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when financed amount > 0 but no loan details provided', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 2,
        cashAmount: 100000, // Partial payment, needs loan but no loanDetails
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when loan type is not "accion"', async () => {
      const dto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 2,
        cashAmount: 0,
        loanDetails: {
          interest_rate: 0.02,
          loan_type: 'corriente', // Invalid type
        },
      } as unknown as PurchaseStockDto;

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });

    it('should throw InvalidRequestError when interest rate is zero or negative', async () => {
      const dto: PurchaseStockDto = {
        memberId: mockMemberId,
        stockId: mockStockId,
        quantity: 2,
        cashAmount: 0,
        loanDetails: {
          interest_rate: 0,
          loan_type: 'accion',
        },
      };

      await expect(useCase.execute(dto)).rejects.toThrow(InvalidRequestError);
    });
  });
});
