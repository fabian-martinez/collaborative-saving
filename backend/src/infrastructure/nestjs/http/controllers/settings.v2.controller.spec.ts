import { Test, TestingModule } from '@nestjs/testing';
import { SettingsV2Controller } from './settings.v2.controller';
import { GetLoanTypesQueryHandler } from '@application/queries/settings/get-loan-types.query-handler';
import { GetStockTypesQueryHandler } from '@application/queries/settings/get-stock-types.query-handler';
import { GetInterestDistributionConfigsQueryHandler } from '@application/queries/settings/get-interest-distribution-configs.query-handler';
import { CreateInterestDistributionConfigUseCase } from '@application/use-cases/settings/create-interest-distribution-config.use-case';
import { UpdateInterestDistributionConfigUseCase } from '@application/use-cases/settings/update-interest-distribution-config.use-case';
import { DeleteInterestDistributionConfigUseCase } from '@application/use-cases/settings/delete-interest-distribution-config.use-case';
import { CreateLoanTypeUseCase } from '@application/use-cases/settings/create-loan-type.use-case';
import { UpdateLoanTypeUseCase } from '@application/use-cases/settings/update-loan-type.use-case';
import { DeleteLoanTypeUseCase } from '@application/use-cases/settings/delete-loan-type.use-case';
import { CreateStockTypeUseCase } from '@application/use-cases/settings/create-stock-type.use-case';
import { UpdateStockTypeUseCase } from '@application/use-cases/settings/update-stock-type.use-case';
import { DeleteStockTypeUseCase } from '@application/use-cases/settings/delete-stock-type.use-case';
import { AmortizationType } from '@domain/entities/loan-type.entity';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

describe('SettingsV2Controller', () => {
  let controller: SettingsV2Controller;

  const mockGetLoanTypesQuery = { execute: jest.fn() };
  const mockGetStockTypesQuery = { execute: jest.fn() };
  const mockGetInterestDistributionConfigsQuery = { execute: jest.fn() };
  const mockCreateInterestDistributionConfigUseCase = { execute: jest.fn() };
  const mockUpdateInterestDistributionConfigUseCase = { execute: jest.fn() };
  const mockDeleteInterestDistributionConfigUseCase = { execute: jest.fn() };
  const mockCreateLoanTypeUseCase = { execute: jest.fn() };
  const mockUpdateLoanTypeUseCase = { execute: jest.fn() };
  const mockDeleteLoanTypeUseCase = { execute: jest.fn() };
  const mockCreateStockTypeUseCase = { execute: jest.fn() };
  const mockUpdateStockTypeUseCase = { execute: jest.fn() };
  const mockDeleteStockTypeUseCase = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsV2Controller],
      providers: [
        { provide: GetLoanTypesQueryHandler, useValue: mockGetLoanTypesQuery },
        { provide: GetStockTypesQueryHandler, useValue: mockGetStockTypesQuery },
        { provide: GetInterestDistributionConfigsQueryHandler, useValue: mockGetInterestDistributionConfigsQuery },
        { provide: CreateInterestDistributionConfigUseCase, useValue: mockCreateInterestDistributionConfigUseCase },
        { provide: UpdateInterestDistributionConfigUseCase, useValue: mockUpdateInterestDistributionConfigUseCase },
        { provide: DeleteInterestDistributionConfigUseCase, useValue: mockDeleteInterestDistributionConfigUseCase },
        { provide: CreateLoanTypeUseCase, useValue: mockCreateLoanTypeUseCase },
        { provide: UpdateLoanTypeUseCase, useValue: mockUpdateLoanTypeUseCase },
        { provide: DeleteLoanTypeUseCase, useValue: mockDeleteLoanTypeUseCase },
        { provide: CreateStockTypeUseCase, useValue: mockCreateStockTypeUseCase },
        { provide: UpdateStockTypeUseCase, useValue: mockUpdateStockTypeUseCase },
        { provide: DeleteStockTypeUseCase, useValue: mockDeleteStockTypeUseCase },
      ],
    }).compile();

    controller = module.get<SettingsV2Controller>(SettingsV2Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Loan Types', () => {
    const mockLoanType = {
      id: 'loan-1',
      name: 'Personal Loan',
      defaultApprovedAmount: 1000,
      defaultInterestRate: 0.1,
      defaultTerm: 12,
      amortizationType: AmortizationType.FRENCH,
    };

    it('getLoanTypes should return list of loan types', async () => {
      mockGetLoanTypesQuery.execute.mockResolvedValue([mockLoanType]);
      const result = await controller.getLoanTypes();
      expect(result).toEqual([{
        id: 'loan-1',
        name: 'Personal Loan',
        default_approved_amount: 1000,
        default_interest_rate: 0.1,
        default_term: 12,
        amortization_type: AmortizationType.FRENCH,
      }]);
    });

    it('createLoanType should create and return a loan type', async () => {
      const dto = {
        name: 'New Loan',
        default_approved_amount: 2000,
        default_interest_rate: 0.15,
        default_term: 24,
        amortization_type: AmortizationType.GERMAN,
      };
      mockCreateLoanTypeUseCase.execute.mockResolvedValue({ ...mockLoanType, ...dto, defaultApprovedAmount: dto.default_approved_amount, defaultInterestRate: dto.default_interest_rate, defaultTerm: dto.default_term, amortizationType: dto.amortization_type });
      
      const result = await controller.createLoanType(dto);
      expect(result.name).toBe('New Loan');
      expect(result.default_approved_amount).toBe(2000);
      expect(mockCreateLoanTypeUseCase.execute).toHaveBeenCalled();
    });

    it('updateLoanType should update and return a loan type', async () => {
      const dto = { name: 'Updated Loan' };
      mockUpdateLoanTypeUseCase.execute.mockResolvedValue({ ...mockLoanType, name: 'Updated Loan' });
      
      const result = await controller.updateLoanType('loan-1', dto);
      expect(result.name).toBe('Updated Loan');
      expect(mockUpdateLoanTypeUseCase.execute).toHaveBeenCalledWith({ id: 'loan-1', ...dto, defaultApprovedAmount: undefined, defaultInterestRate: undefined, defaultTerm: undefined, amortizationType: undefined });
    });

    it('deleteLoanType should delete a loan type', async () => {
      await controller.deleteLoanType('loan-1');
      expect(mockDeleteLoanTypeUseCase.execute).toHaveBeenCalledWith('loan-1');
    });
  });

  describe('Stock Types', () => {
    const mockStockType = {
      id: 'stock-1',
      name: 'Common Stock',
      behavior: StockBehavior.CAPITAL_APPRECIATION,
      isGuaranteed: false,
      guaranteedYield: null,
    };

    it('getStockTypes should return list of stock types', async () => {
      mockGetStockTypesQuery.execute.mockResolvedValue([mockStockType]);
      const result = await controller.getStockTypes();
      expect(result).toEqual([mockStockType]);
    });

    it('createStockType should create and return a stock type', async () => {
      const dto = {
        name: 'New Stock',
        behavior: StockBehavior.DIVIDEND_YIELD,
        isGuaranteed: true,
        guaranteedYield: 0.05,
      };
      mockCreateStockTypeUseCase.execute.mockResolvedValue({ id: 'stock-2', ...dto });
      
      const result = await controller.createStockType(dto);
      expect(result.name).toBe('New Stock');
      expect(result.isGuaranteed).toBe(true);
      expect(mockCreateStockTypeUseCase.execute).toHaveBeenCalled();
    });

    it('updateStockType should update and return a stock type', async () => {
      const dto = { name: 'Updated Stock' };
      mockUpdateStockTypeUseCase.execute.mockResolvedValue({ ...mockStockType, name: 'Updated Stock' });
      
      const result = await controller.updateStockType('stock-1', dto);
      expect(result.name).toBe('Updated Stock');
      expect(mockUpdateStockTypeUseCase.execute).toHaveBeenCalledWith({ id: 'stock-1', ...dto, behavior: undefined, isGuaranteed: undefined, guaranteedYield: undefined });
    });

    it('deleteStockType should delete a stock type', async () => {
      await controller.deleteStockType('stock-1');
      expect(mockDeleteStockTypeUseCase.execute).toHaveBeenCalledWith('stock-1');
    });
  });

  describe('Interest Distribution Configs', () => {
    const mockConfig = {
      id: 'config-1',
      loanTypeId: 'loan-1',
      stockTypeId: 'stock-1',
    };

    it('getDistributionConfigs should return list of configs', async () => {
      mockGetInterestDistributionConfigsQuery.execute.mockResolvedValue([mockConfig]);
      const result = await controller.getDistributionConfigs();
      expect(result).toEqual([{
        id: 'config-1',
        loan_type_id: 'loan-1',
        stock_type_id: 'stock-1',
      }]);
    });

    it('createConfig should create and return a config', async () => {
      const dto = {
        loan_type_id: 'loan-2',
        stock_type_id: 'stock-2',
      };
      mockCreateInterestDistributionConfigUseCase.execute.mockResolvedValue({ id: 'config-2', loanTypeId: 'loan-2', stockTypeId: 'stock-2' });
      
      const result = await controller.createConfig(dto);
      expect(result.loan_type_id).toBe('loan-2');
      expect(mockCreateInterestDistributionConfigUseCase.execute).toHaveBeenCalled();
    });

    it('updateConfig should update and return a config', async () => {
      const dto = { loan_type_id: 'loan-3' };
      mockUpdateInterestDistributionConfigUseCase.execute.mockResolvedValue({ ...mockConfig, loanTypeId: 'loan-3' });
      
      const result = await controller.updateConfig('config-1', dto);
      expect(result.loan_type_id).toBe('loan-3');
      expect(mockUpdateInterestDistributionConfigUseCase.execute).toHaveBeenCalledWith({ id: 'config-1', loanTypeId: 'loan-3', stockTypeId: undefined });
    });

    it('deleteConfig should delete a config', async () => {
      await controller.deleteConfig('config-1');
      expect(mockDeleteInterestDistributionConfigUseCase.execute).toHaveBeenCalledWith('config-1');
    });
  });
});
