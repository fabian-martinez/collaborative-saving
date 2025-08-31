import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebtCapacityService } from './debt-capacity.service';
import { Member } from './entities/member.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';

describe('DebtCapacityService', () => {
  let service: DebtCapacityService;
  let memberRepository: Repository<Member>;
  let stockSubscriptionRepository: Repository<StockSubscription>;
  let loanRepository: Repository<Loan>;

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
    deletedAt: null,
  } as unknown as Member;

  const mockStock = {
    id: 'stock-1',
    type: 'Test Stock',
    value: 100,
    monthly_contribution: 25,
  };

  const mockStockSubscription = {
    id: 'subscription-1',
    member_id: 'member-1',
    stock_id: 'stock-1',
    quantity: 10,
    status: 'active',
    purchase_date: '2023-01-01',
    financing_loan_id: null,
    financing_loan: null,
    stock: mockStock as any,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtCapacityService,
        {
          provide: getRepositoryToken(Member),
          useValue: {
            findOneBy: jest.fn(),
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
          },
        },
      ],
    }).compile();

    service = module.get<DebtCapacityService>(DebtCapacityService);
    memberRepository = module.get<Repository<Member>>(getRepositoryToken(Member));
    stockSubscriptionRepository = module.get<Repository<StockSubscription>>(getRepositoryToken(StockSubscription));
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDebtCapacity', () => {
    it('should calculate debt capacity for member with savings and loans', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockSubscriptionRepository, 'find').mockResolvedValue([mockStockSubscription]);
      jest.spyOn(loanRepository, 'find').mockResolvedValue([mockLoan]);

      const result = await service.calculateDebtCapacity('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        totalSavings: 1000, // 10 * 100
        totalCredits: 2500,
        availableCapacity: 0, // 2000 - 2500 = 0 (no puede ser negativo)
        totalCapacity: 2000, // 1000 * 2
        utilization: 125, // (2500 / 2000) * 100
        creditStatus: 'high', // > 75%
        calculatedAt: expect.any(Date),
      });
    });

    it('should calculate debt capacity for member with only savings', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockSubscriptionRepository, 'find').mockResolvedValue([mockStockSubscription]);
      jest.spyOn(loanRepository, 'find').mockResolvedValue([]);

      const result = await service.calculateDebtCapacity('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        totalSavings: 1000,
        totalCredits: 0,
        availableCapacity: 2000, // 2000 - 0
        totalCapacity: 2000,
        utilization: 0,
        creditStatus: 'excellent', // 0%
        calculatedAt: expect.any(Date),
      });
    });

    it('should calculate debt capacity for member with moderate utilization', async () => {
      const moderateLoan = { ...mockLoan, outstanding_balance: 1000 };
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockSubscriptionRepository, 'find').mockResolvedValue([mockStockSubscription]);
      jest.spyOn(loanRepository, 'find').mockResolvedValue([moderateLoan]);

      const result = await service.calculateDebtCapacity('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        totalSavings: 1000,
        totalCredits: 1000,
        availableCapacity: 1000, // 2000 - 1000
        totalCapacity: 2000,
        utilization: 50, // (1000 / 2000) * 100
        creditStatus: 'good', // 50%
        calculatedAt: expect.any(Date),
      });
    });

    it('should throw error when member not found', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.calculateDebtCapacity('non-existent')).rejects.toThrow('Member #non-existent not found');
    });

    it('should handle member with no stock subscriptions', async () => {
      jest.spyOn(memberRepository, 'findOneBy').mockResolvedValue(mockMember);
      jest.spyOn(stockSubscriptionRepository, 'find').mockResolvedValue([]);
      jest.spyOn(loanRepository, 'find').mockResolvedValue([]);

      const result = await service.calculateDebtCapacity('member-1');

      expect(result).toEqual({
        memberId: 'member-1',
        memberName: 'Test Member',
        totalSavings: 0,
        totalCredits: 0,
        availableCapacity: 0,
        totalCapacity: 0,
        utilization: 0,
        creditStatus: 'excellent',
        calculatedAt: expect.any(Date),
      });
    });
  });

  describe('getDebtCapacitySummary', () => {
    it('should return debt capacity summary for multiple members', async () => {
      const mockMember2 = { ...mockMember, id: 'member-2', name: 'Test Member 2' };
      
      jest.spyOn(memberRepository, 'findOneBy')
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(mockMember2);
      
      jest.spyOn(stockSubscriptionRepository, 'find')
        .mockResolvedValueOnce([mockStockSubscription])
        .mockResolvedValueOnce([mockStockSubscription]);
      
      jest.spyOn(loanRepository, 'find')
        .mockResolvedValueOnce([mockLoan])
        .mockResolvedValueOnce([]);

      const result = await service.getDebtCapacitySummary(['member-1', 'member-2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        memberId: 'member-1',
        creditStatus: 'high',
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        memberId: 'member-2',
        creditStatus: 'excellent',
      }));
    });
  });

  describe('getOrganizationDebtCapacityStats', () => {
    it('should return organization debt capacity statistics', async () => {
      const mockMember2 = { ...mockMember, id: 'member-2', name: 'Test Member 2' };
      
      jest.spyOn(memberRepository, 'find').mockResolvedValue([mockMember, mockMember2]);
      jest.spyOn(memberRepository, 'findOneBy')
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(mockMember2);
      
      jest.spyOn(stockSubscriptionRepository, 'find')
        .mockResolvedValueOnce([mockStockSubscription])
        .mockResolvedValueOnce([mockStockSubscription]);
      
      jest.spyOn(loanRepository, 'find')
        .mockResolvedValueOnce([mockLoan])
        .mockResolvedValueOnce([]);

      const result = await service.getOrganizationDebtCapacityStats();

      expect(result).toEqual({
        totalMembers: 2,
        totalSavings: 2000, // 1000 + 1000
        totalCredits: 2500, // 2500 + 0
        averageUtilization: 62.5, // (125 + 0) / 2
        membersByCreditStatus: {
          excellent: 1,
          good: 0,
          moderate: 0,
          high: 1,
        },
      });
    });

    it('should handle organization with no active members', async () => {
      jest.spyOn(memberRepository, 'find').mockResolvedValue([]);

      const result = await service.getOrganizationDebtCapacityStats();

      expect(result).toEqual({
        totalMembers: 0,
        totalSavings: 0,
        totalCredits: 0,
        averageUtilization: NaN,
        membersByCreditStatus: {
          excellent: 0,
          good: 0,
          moderate: 0,
          high: 0,
        },
      });
    });
  });
});
