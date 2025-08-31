import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembersService } from './members.service';
import { Member } from './entities/member.entity';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Operation } from '../operations/entities/operation.entity';
import { NotFoundException } from '@nestjs/common';
import { OperationType } from '../common/enums/operation-type.enum';

describe('MembersService', () => {
  let service: MembersService;
  let memberRepository: Repository<Member>;
  let ledgerEntryRepository: Repository<LedgerEntry>;
  let stockSubscriptionRepository: Repository<StockSubscription>;
  let loanRepository: Repository<Loan>;
  let stockRepository: Repository<Stock>;
  let operationRepository: Repository<Operation>;

  const mockMember = {
    id: 'member-1',
    name: 'Test Member',
    email: 'test@example.com',
    identificationNumber: '123456789',
    role: 'member',
    status: 'active',
    address: 'Test Address',
    phone: '+1234567890',
    beneficiary: 'Test Beneficiary',
    registrationDate: new Date('2023-01-01'),
    deletedAt: undefined,
  } as unknown as Member;

  const mockStock: Stock = {
    id: 'stock-1',
    type: 'Test Stock',
    value: 100,
    monthly_contribution: 25,
    is_guaranteed: false,
    guaranteed_yield: null,
    behavior: 'CAPITAL_APPRECIATION' as any,
    value_history: [],
    deleted_at: null,
  } as Stock;

  const mockStockSubscription = {
    id: 'subscription-1',
    member_id: 'member-1',
    stock_id: 'stock-1',
    quantity: 10,
    status: 'active',
    purchase_date: '2023-01-01',
    financing_loan_id: null,
    financing_loan: null,
    stock: mockStock,
    member: mockMember,
    deleted_at: null,
  } as unknown as StockSubscription;

  const mockLoan: Loan = {
    id: 'loan-1',
    member_id: 'member-1',
    loan_type: 'corriente',
    approved_amount: 5000,
    monthly_payment_amount: 250,
    outstanding_balance: 2500,
    interest_rate: 0.02,
    term: 24,
    disbursed_amount: 5000,
    status: 'active',
    creation_date: '2023-01-01',
    due_installments: 0,
    guaranteed_stock_id: null,
    guaranteed_stock: null,
    member: mockMember,
    transactions: [],
    deleted_at: null,
  } as Loan;

  const mockOperation = {
    id: 'operation-1',
    member_id: 'member-1',
    meeting_id: 'meeting-1',
    type: OperationType.STOCK_PURCHASE,
    date: new Date('2023-01-01'),
    description: 'Test operation',
    member: mockMember,
    meeting: null as any,
    ledger_entries: [],
    total_debit: 0,
    total_credit: 0,
    calculateTotals: jest.fn(),
  } as unknown as Operation;

  const mockLedgerEntry = {
    id: 'entry-1',
    operation_id: 'operation-1',
    member_id: 'member-1',
    account_type: 'cash',
    description: 'Test entry',
    amount: 100,
    created_at: new Date('2023-01-01'),
    operation: mockOperation,
    loan_id: undefined,
    loan: undefined,
    stock_id: 'stock-1',
    stock: mockStock,
    mandatory_contribution_id: null,
    mandatory_contribution: null,
    stock_subscription_id: 'subscription-1',
    stock_subscription: mockStockSubscription,
  } as unknown as LedgerEntry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getRepositoryToken(Member),
          useValue: {
            findOneBy: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LedgerEntry),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockSubscription),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Loan),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Operation),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    memberRepository = module.get<Repository<Member>>(getRepositoryToken(Member));
    ledgerEntryRepository = module.get<Repository<LedgerEntry>>(getRepositoryToken(LedgerEntry));
    stockSubscriptionRepository = module.get<Repository<StockSubscription>>(getRepositoryToken(StockSubscription));
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
    stockRepository = module.get<Repository<Stock>>(getRepositoryToken(Stock));
    operationRepository = module.get<Repository<Operation>>(getRepositoryToken(Operation));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMemberDetail', () => {
    it('should return member detail', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);

      const result = await service.getMemberDetail('member-1');

      expect(result).toEqual({
        id: mockMember.id,
        name: mockMember.name,
        email: mockMember.email,
        identificationNumber: mockMember.identificationNumber,
        role: mockMember.role,
        status: mockMember.status,
        address: mockMember.address,
        phone: mockMember.phone,
        beneficiary: mockMember.beneficiary,
        registrationDate: mockMember.registrationDate,
      });
    });

    it('should throw NotFoundException when member not found', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.getMemberDetail('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMemberStocks', () => {
    it('should return member stocks summary', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockSubscriptionRepository, 'find').mockResolvedValue([mockStockSubscription]);

      const result = await service.getMemberStocks('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        stocks: [
          {
            id: 'stock-1',
            name: 'Test Stock',
            quantity: 10,
            value: 1000,
            nominalValue: 100,
            requiredContribution: 25,
          },
        ],
        totalValue: 1000,
        totalMonthlyContribution: 25,
      });
    });
  });

  describe('getMemberLoans', () => {
    it('should return member loans summary', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(loanRepository, 'find').mockResolvedValue([mockLoan]);

      const result = await service.getMemberLoans('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        loans: [
          {
            id: 'loan-1',
            loanType: 'corriente',
            approvedAmount: 5000,
            monthlyPaymentAmount: 250,
            outstandingBalance: 2500,
            interestRate: 0.02,
            term: 24,
            status: 'active',
            creationDate: '2023-01-01',
          },
        ],
        totalApprovedAmount: 5000,
        totalOutstandingBalance: 2500,
        totalMonthlyPayment: 250,
      });
    });
  });

  describe('calculateMemberDebtCapacity', () => {
    it('should calculate debt capacity correctly', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockSubscriptionRepository, 'find').mockResolvedValue([mockStockSubscription]);
      jest.spyOn(loanRepository, 'find').mockResolvedValue([mockLoan]);

      const result = await service.calculateMemberDebtCapacity('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        totalSavings: 1000,
        totalCredits: 2500,
        availableCapacity: 0, // 2000 - 2500 = 0 (no puede ser negativo)
        totalCapacity: 2000, // 1000 * 2
        utilization: 125, // (2500 / 2000) * 100
        creditStatus: 'high', // > 75%
        calculatedAt: expect.any(Date),
      });
    });
  });

  describe('getMemberSummary', () => {
    it('should return complete member summary', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockSubscriptionRepository, 'find').mockResolvedValue([mockStockSubscription]);
      jest.spyOn(loanRepository, 'find').mockResolvedValue([mockLoan]);

      const result = await service.getMemberSummary('member-1');

      expect(result).toEqual({
        member: expect.objectContaining({
          id: 'member-1',
          name: 'Test Member',
        }),
        stocks: expect.objectContaining({
          memberId: 'member-1',
          memberName: 'Test Member',
        }),
        loans: expect.objectContaining({
          memberId: 'member-1',
          memberName: 'Test Member',
        }),
        debtCapacity: expect.objectContaining({
          memberId: 'member-1',
          memberName: 'Test Member',
        }),
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('getStockTransactionHistory', () => {
    it('should return stock transaction history', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockRepository, 'findOneBy').mockResolvedValue(mockStock);
      jest.spyOn(ledgerEntryRepository, 'find').mockResolvedValue([mockLedgerEntry]);

      const result = await service.getStockTransactionHistory('stock-1', 'member-1');

      expect(result).toEqual({
        stockId: 'stock-1',
        stockName: 'Test Stock',
        memberId: 'member-1',
        memberName: 'Test Member',
        nominalValue: 100,
        requiredContribution: 25,
        transactions: [
          {
            id: 'entry-1',
            date: expect.any(Date),
            period: expect.any(String),
            description: 'Test entry',
            amount: 100,
            status: 'paid',
            operationType: 'STOCK_PURCHASE',
          },
        ],
        totalAmount: 100,
      });
    });

    it('should throw NotFoundException when stock not found', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.getStockTransactionHistory('non-existent', 'member-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLoanInstallments', () => {
    it('should return loan installments', async () => {
      const mockLoanWithMember = { ...mockLoan, member: mockMember };
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoanWithMember);
      jest.spyOn(ledgerEntryRepository, 'find').mockResolvedValue([]);

      const result = await service.getLoanInstallments('loan-1');

      expect(result).toEqual({
        loanId: 'loan-1',
        memberId: 'member-1',
        memberName: 'Test Member',
        loanAmount: 5000,
        term: 24,
        interestRate: 0.02,
        paidInstallments: [],
        pendingInstallments: expect.arrayContaining([
          expect.objectContaining({
            installmentNumber: 1,
            status: 'pending',
          }),
        ]),
        totalPaid: 0,
        totalPending: 6000, // 24 * 250
        outstandingBalance: 2500,
      });
    });

    it('should throw NotFoundException when loan not found', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getLoanInstallments('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMemberTransactions', () => {
    it('should return member transactions', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(ledgerEntryRepository, 'find').mockResolvedValue([mockLedgerEntry]);

      const result = await service.getMemberTransactions('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        transactions: [
          {
            id: 'entry-1',
            date: expect.any(Date),
            description: 'Test entry',
            amount: 100,
            operationType: 'STOCK_PURCHASE',
            accountType: 'cash',
            stockId: 'stock-1',
            loanId: undefined,
          },
        ],
        totalTransactions: 1,
        totalAmount: 100,
      });
    });
  });
});
