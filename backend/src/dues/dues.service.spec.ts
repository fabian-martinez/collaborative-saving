import { Test, TestingModule } from '@nestjs/testing';
import { DuesService } from './dues.service';
import { DataSource } from 'typeorm';
import { MandatoryContributionsService } from '../mandatory-contributions/mandatory-contributions.service';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { LoansService } from '../loans/loans.service';
import { MembersService } from '../members/members.service';
import { MeetingsService } from '../meetings/meetings.service';
import { NotFoundException } from '@nestjs/common';

describe('DuesService', () => {
  let service: DuesService;
  let dataSource: jest.Mocked<DataSource>;
  let mandatoryContributionsService: jest.Mocked<MandatoryContributionsService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let stockSubscriptionsService: jest.Mocked<StockSubscriptionsService>;
  let loansService: jest.Mocked<LoansService>;
  let membersService: jest.Mocked<MembersService>;
  let meetingsService: jest.Mocked<MeetingsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuesService,
        {
          provide: DataSource,
          useValue: {
            manager: {
              find: jest.fn(),
              createQueryBuilder: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getExists: jest.fn().mockResolvedValue(false),
              }),
            },
          },
        },
        {
          provide: MandatoryContributionsService,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: StockSubscriptionsService,
          useValue: {
            findActiveByMember: jest.fn(),
          },
        },
        {
          provide: LoansService,
          useValue: {
            findActiveByMember: jest.fn(),
          },
        },
        {
          provide: MembersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: MeetingsService,
          useValue: {
            findActive: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DuesService>(DuesService);
    dataSource = module.get(DataSource);
    mandatoryContributionsService = module.get(MandatoryContributionsService);
    stockSubscriptionsService = module.get(StockSubscriptionsService);
    loansService = module.get(LoansService);
    membersService = module.get(MembersService);
    meetingsService = module.get(MeetingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMemberDuesForActiveMeeting', () => {
    const memberId = 'some-member-id';
    const activeMeeting = {
      id: 'meeting-1',
      date: new Date(),
      status: 'active',
    };
    const member = { id: memberId, name: 'John Doe' };

    it('should throw NotFoundException if no active meeting is found', async () => {
      meetingsService.findActive.mockResolvedValue(null);
      await expect(
        service.getMemberDuesForActiveMeeting(memberId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if member is not found', async () => {
      meetingsService.findActive.mockResolvedValue(activeMeeting as any);
      membersService.findOne.mockResolvedValue(null as any);
      await expect(
        service.getMemberDuesForActiveMeeting(memberId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return all types of dues for a member', async () => {
      meetingsService.findActive.mockResolvedValue(activeMeeting as any);
      membersService.findOne.mockResolvedValue(member as any);
      mandatoryContributionsService.findAll.mockResolvedValue([
        { id: 'mc-1', asset_type: 'Fondo de Bienestar', value: 1000 },
      ] as any);
      stockSubscriptionsService.findActiveByMember.mockResolvedValue([
        {
          id: 'ss-1',
          member_id: memberId,
          quantity: 2,
          stock: {
            id: 'stock-1',
            type: 'Ordinaria',
            monthly_contribution: 5000,
            value: 50000,
          },
        },
      ] as any);
      loansService.findActiveByMember.mockResolvedValue([
        {
          id: 'loan-1',
          loan_type: 'Libre Inversión',
          outstanding_balance: 100000,
          monthly_payment_amount: 10000,
          interest_rate: 0.02,
          payment_status_this_month: 'PENDING',
        },
      ] as any);

      const dues = await service.getMemberDuesForActiveMeeting(memberId);

      expect(dues).toHaveLength(3);
      expect(dues.some((due) => due.type === 'mandatory_contribution')).toBe(
        true,
      );
      expect(dues.some((due) => due.type === 'stock_fee')).toBe(true);
      expect(dues.some((due) => due.type === 'loan_payment')).toBe(true);
    });

    it('should return an empty array when a member has no dues', async () => {
      meetingsService.findActive.mockResolvedValue(activeMeeting as any);
      membersService.findOne.mockResolvedValue(member as any);
      mandatoryContributionsService.findAll.mockResolvedValue([]);
      stockSubscriptionsService.findActiveByMember.mockResolvedValue([]);
      loansService.findActiveByMember.mockResolvedValue([]);

      const dues = await service.getMemberDuesForActiveMeeting(memberId);
      expect(dues).toHaveLength(0);
    });

    it('should not include paid loans in dues', async () => {
      meetingsService.findActive.mockResolvedValue(activeMeeting as any);
      membersService.findOne.mockResolvedValue(member as any);
      mandatoryContributionsService.findAll.mockResolvedValue([]);
      stockSubscriptionsService.findActiveByMember.mockResolvedValue([]);
      loansService.findActiveByMember.mockResolvedValue([
        {
          id: 'loan-1',
          payment_status_this_month: 'PAID',
          outstanding_balance: 100000,
        },
      ] as any);

      // Mock createQueryBuilder para simular que ya se pagó el interés
      (dataSource.manager.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getExists: jest.fn().mockResolvedValue(true), // Ya se pagó el interés
      });

      const dues = await service.getMemberDuesForActiveMeeting(memberId);
      expect(dues.some((due) => due.type === 'loan_payment')).toBe(false);
    });
  });

  describe('calculateInsurance', () => {
    const memberId = 'some-member-id';
    const mockStock = { id: 'stock-1', value: 50000 };
    const mockLoan = { id: 'loan-1', outstanding_balance: 100000 };

    it('should calculate insurance correctly when debt is greater than savings', async () => {
      (dataSource.manager.find as jest.Mock).mockResolvedValue([
        { quantity: 1, stock: mockStock, financing_loan: null },
      ]);
      loansService.findActiveByMember.mockResolvedValue([mockLoan] as any);

      const result = await service.calculateInsurance(memberId);
      const expectedInsurance = (100000 - 50000) * 0.001;
      expect(result.insuranceAmount).toBe(expectedInsurance);
    });

    it('should be 0 when savings are greater than debt', async () => {
      (dataSource.manager.find as jest.Mock).mockResolvedValue([
        { quantity: 3, stock: mockStock, financing_loan: null },
      ]);
      loansService.findActiveByMember.mockResolvedValue([mockLoan] as any);

      const result = await service.calculateInsurance(memberId);
      expect(result.insuranceAmount).toBe(0);
    });

    it('should reduce debt base with capitalPayment', async () => {
      (dataSource.manager.find as jest.Mock).mockResolvedValue([
        { quantity: 1, stock: mockStock, financing_loan: null },
      ]);
      loansService.findActiveByMember.mockResolvedValue([mockLoan] as any);
      const capitalPayment = 20000;
      const result = await service.calculateInsurance(memberId, capitalPayment);
      const expectedInsurance = (100000 - capitalPayment - 50000) * 0.001;
      expect(result.insuranceAmount).toBe(expectedInsurance);
    });

    it('should exclude financing loans from debt calculation', async () => {
      const financingLoan = {
        id: 'financing-loan-1',
        outstanding_balance: 200000,
        status: 'active',
      };
      (dataSource.manager.find as jest.Mock).mockResolvedValue([
        {
          quantity: 1,
          stock: mockStock,
          financing_loan_id: financingLoan.id,
          financing_loan: financingLoan,
        },
      ]);
      loansService.findActiveByMember.mockResolvedValue([
        mockLoan,
        financingLoan,
      ] as any);
      const result = await service.calculateInsurance(memberId);
      // Debt should only be from mockLoan (100000), not financingLoan. Savings are 0.
      const expectedInsurance = (100000 - 0) * 0.001;
      expect(result.insuranceAmount).toBe(expectedInsurance);
    });

    it('should exclude financed savings from savings calculation', async () => {
      const financingLoan = {
        id: 'financing-loan-1',
        outstanding_balance: 50000,
        status: 'active',
      };
      (dataSource.manager.find as jest.Mock).mockResolvedValue([
        {
          quantity: 1,
          stock: mockStock,
          financing_loan_id: financingLoan.id,
          financing_loan: financingLoan,
        },
        {
          quantity: 1,
          stock: { id: 'stock-2', value: 20000 },
          financing_loan: null,
        },
      ]);
      loansService.findActiveByMember.mockResolvedValue([mockLoan] as any);
      const result = await service.calculateInsurance(memberId);
      // Total debt is 100000. Total savings should only be 20000.
      const expectedInsurance = (100000 - 20000) * 0.001;
      expect(result.insuranceAmount).toBe(expectedInsurance);
    });
  });
});
