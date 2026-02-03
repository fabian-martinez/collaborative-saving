import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StocksV2Controller } from './stocks.v2.controller';
import { GetStocksQueryHandler } from '@application/queries/stocks/get-stocks.query-handler';
import { GetStockDetailQueryHandler } from '@application/queries/stocks/get-stock-detail.query-handler';
import { CreateStockUseCase } from '@application/use-cases/stocks/create-stock.use-case';
import { UpdateStockUseCase } from '@application/use-cases/stocks/update-stock.use-case';
import { DeleteStockUseCase } from '@application/use-cases/stocks/delete-stock.use-case';
import { StockBehavior } from '@domain/entities/stock.entity';
import { CreateStockHttpDto } from '../dto/create-stock-http.dto';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { StockResponseHttpDto } from '../dto/stock-response-http.dto';
import { UpdateStockHttpDto } from '../dto/update-stock-http.dto';
import { UpdateStockDto } from '@application/dto/stocks/update-stock.dto';
import { StockTypeResponseDto } from '@application/dto/stock-type/stock-type-response.dto';

describe('StocksV2Controller', () => {
  let controller: StocksV2Controller;
  let getStocksQuery: jest.Mocked<GetStocksQueryHandler>;
  let getStockDetailQuery: jest.Mocked<GetStockDetailQueryHandler>;
  let createStockUseCase: jest.Mocked<CreateStockUseCase>;
  let updateStockUseCase: jest.Mocked<UpdateStockUseCase>;
  let deleteStockUseCase: jest.Mocked<DeleteStockUseCase>;

  let getStocksQueryExecuteSpy: jest.SpyInstance;
  let getStockDetailQueryExecuteSpy: jest.SpyInstance;
  let createStockUseCaseExecuteSpy: jest.SpyInstance;
  let updateStockUseCaseExecuteSpy: jest.SpyInstance;
  let deleteStockUseCaseExecuteSpy: jest.SpyInstance;

  const stockType: StockTypeResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'preferential',
    behavior: StockBehavior.CAPITAL_APPRECIATION,
    isGuaranteed: false,
    guaranteedYield: null,
  };

  const mockStockResponse: StockResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'preferential',
    value: 100,
    monthlyContribution: 50,
    createdAt: new Date('2024-01-15'),
    stockType,
  };

  const mockStockResponseHttpDto: StockResponseHttpDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'preferential',
    value: 100,
    monthly_contribution: 50,
    is_guaranteed: false,
    guaranteed_yield: null,
    created_at: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksV2Controller],
      providers: [
        {
          provide: GetStocksQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetStockDetailQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CreateStockUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateStockUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteStockUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StocksV2Controller>(StocksV2Controller);
    getStocksQuery = module.get(GetStocksQueryHandler);
    getStockDetailQuery = module.get(GetStockDetailQueryHandler);
    createStockUseCase = module.get(CreateStockUseCase);
    updateStockUseCase = module.get(UpdateStockUseCase);
    deleteStockUseCase = module.get(DeleteStockUseCase);

    getStocksQueryExecuteSpy = jest.spyOn(getStocksQuery, 'execute');
    getStockDetailQueryExecuteSpy = jest.spyOn(getStockDetailQuery, 'execute');
    createStockUseCaseExecuteSpy = jest.spyOn(createStockUseCase, 'execute');
    updateStockUseCaseExecuteSpy = jest.spyOn(updateStockUseCase, 'execute');
    deleteStockUseCaseExecuteSpy = jest.spyOn(deleteStockUseCase, 'execute');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return list of active stocks', async () => {
      const stocks: StockResponseDto[] = [
        mockStockResponse,
        {
          ...mockStockResponse,
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'guaranteed',
          value: 150,
          monthlyContribution: 75,
          createdAt: new Date('2024-01-15'),
          stockType,
        },
      ];
      const stocksHttpDto: StockResponseHttpDto[] = [
        mockStockResponseHttpDto,
        {
          ...mockStockResponseHttpDto,
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'guaranteed',
          value: 150,
          monthly_contribution: 75,
          created_at: new Date('2024-01-15'),
        },
      ];

      getStocksQueryExecuteSpy.mockResolvedValue(stocks);

      const result = await controller.list();

      expect(getStocksQueryExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(stocksHttpDto);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no stocks exist', async () => {
      getStocksQueryExecuteSpy.mockResolvedValue([]);

      const result = await controller.list();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      getStocksQueryExecuteSpy.mockRejectedValue(error);

      await expect(controller.list()).rejects.toThrow(HttpException);
      await expect(controller.list()).rejects.toThrow('Database error');
    });
  });

  describe('detail', () => {
    it('should return stock detail by id', async () => {
      const stockId = '550e8400-e29b-41d4-a716-446655440000';
      getStockDetailQueryExecuteSpy.mockResolvedValue(mockStockResponse);

      const result = await controller.detail(stockId);

      expect(getStockDetailQueryExecuteSpy).toHaveBeenCalledWith(stockId);
      expect(result).toEqual(mockStockResponseHttpDto);
    });

    it('should throw HttpException with NOT_FOUND when stock not found', async () => {
      const stockId = '550e8400-e29b-41d4-a716-446655440000';
      getStockDetailQueryExecuteSpy.mockRejectedValue(
        new HttpException('Stock not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.detail(stockId)).rejects.toThrow(HttpException);

      const error = (await controller
        .detail(stockId)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should handle generic errors', async () => {
      const stockId = '550e8400-e29b-41d4-a716-446655440000';
      const error = new Error('Internal error');
      getStockDetailQueryExecuteSpy.mockRejectedValue(error);

      await expect(controller.detail(stockId)).rejects.toThrow(HttpException);
      await expect(controller.detail(stockId)).rejects.toThrow(
        'Internal error',
      );
    });
  });

  describe('create', () => {
    it('should create a stock successfully', async () => {
      const createDto: CreateStockHttpDto = {
        name: 'preferential',
        value: 100,
        monthly_contribution: 50,
      };

      createStockUseCaseExecuteSpy.mockResolvedValue(mockStockResponse);

      const result = await controller.create(createDto);

      expect(createStockUseCaseExecuteSpy).toHaveBeenCalledWith({
        name: 'preferential',
        value: 100,
        monthlyContribution: 50,
        isGuaranteed: undefined,
        guaranteedYield: undefined,
        stockTypeId: undefined,
      });
      expect(result).toEqual(mockStockResponseHttpDto);
    });

    it('should create a stock with all fields', async () => {
      const createDto: CreateStockHttpDto = {
        name: 'guaranteed',
        value: 150,
        monthly_contribution: 75,
        is_guaranteed: true,
        guaranteed_yield: 0.02,
      };

      const fullResponse: StockResponseDto = {
        ...mockStockResponse,
        name: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        stockType: {
          ...stockType,
          isGuaranteed: true,
          guaranteedYield: 0.02,
        },
      };
      const fullResponseHttpDto: StockResponseHttpDto = {
        ...mockStockResponseHttpDto,
        name: 'guaranteed',
        value: 150,
        monthly_contribution: 75,
        is_guaranteed: true,
        guaranteed_yield: 0.02,
      };

      createStockUseCaseExecuteSpy.mockResolvedValue(fullResponse);

      const result = await controller.create(createDto);

      expect(createStockUseCaseExecuteSpy).toHaveBeenCalledWith({
        name: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        stockTypeId: undefined,
      });
      expect(result).toEqual(fullResponseHttpDto);
    });

    it('should handle HttpException errors', async () => {
      const createDto: CreateStockHttpDto = {
        name: 'preferential',
        value: 100,
        monthly_contribution: 50,
      };

      const error = new HttpException(
        'Stock type already exists',
        HttpStatus.BAD_REQUEST,
      );
      createStockUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
      await expect(controller.create(createDto)).rejects.toThrow(
        'Stock type already exists',
      );
    });

    it('should handle generic errors', async () => {
      const createDto: CreateStockHttpDto = {
        name: 'preferential',
        value: 100,
        monthly_contribution: 50,
      };

      const error = new Error('Internal error');
      createStockUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
      await expect(controller.create(createDto)).rejects.toThrow(
        'Internal error',
      );
    });
  });

  describe('update', () => {
    const stockId = '550e8400-e29b-41d4-a716-446655440000';

    it('should update a stock successfully', async () => {
      const updateDto = {
        value: 150,
        monthlyContribution: 75,
      };

      const updatedResponse: StockResponseDto = {
        ...mockStockResponse,
        value: 150,
        monthlyContribution: 75,
        stockType: {
          ...stockType,
          isGuaranteed: false,
          guaranteedYield: null,
        },
      };
      const updatedResponseHttpDto: StockResponseHttpDto = {
        ...mockStockResponseHttpDto,
        value: 150,
        monthly_contribution: 75,
        is_guaranteed: false,
        guaranteed_yield: null,
      };

      updateStockUseCaseExecuteSpy.mockResolvedValue(updatedResponse);

      const result = await controller.update(stockId, updateDto);

      expect(updateStockUseCaseExecuteSpy).toHaveBeenCalledWith(stockId, {
        name: undefined,
        value: 150,
        monthlyContribution: undefined,
        isGuaranteed: undefined,
        guaranteedYield: undefined,
        stockTypeId: undefined,
      });
      expect(result).toEqual(updatedResponseHttpDto);
    });

    it('should update stock with all fields', async () => {
      const updateDto: UpdateStockDto = {
        name: 'new-name',
        value: 200,
        monthlyContribution: 100,
        isGuaranteed: false,
        guaranteedYield: 0.03,
      };
      const updateDtoHttpDto: UpdateStockHttpDto = {
        name: 'new-name',
        value: 200,
        monthly_contribution: 100,
        is_guaranteed: false,
        guaranteed_yield: 0.03,
      };

      const updatedResponse: StockResponseDto = {
        ...mockStockResponse,
        ...updateDto,
        stockType: {
          ...stockType,
          isGuaranteed: true,
          guaranteedYield: 0.03,
        },
      };
      const updatedResponseHttpDto: StockResponseHttpDto = {
        ...mockStockResponseHttpDto,
        ...updateDtoHttpDto,
        value: 200,
        monthly_contribution: 100,
        is_guaranteed: true,
        guaranteed_yield: 0.03,
      };

      updateStockUseCaseExecuteSpy.mockResolvedValue(updatedResponse);

      const result = await controller.update(stockId, updateDtoHttpDto);

      expect(updateStockUseCaseExecuteSpy).toHaveBeenCalledWith(stockId, {
        name: 'new-name',
        value: 200,
        monthlyContribution: 100,
        isGuaranteed: false,
        guaranteedYield: 0.03,
        stockTypeId: undefined,
      });
      expect(result).toEqual(updatedResponseHttpDto);
    });

    it('should handle NotFoundException', async () => {
      const updateDto = {
        value: 150,
      };

      const error = new HttpException(
        `Stock with ID ${stockId} not found`,
        HttpStatus.NOT_FOUND,
      );
      updateStockUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(controller.update(stockId, updateDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update(stockId, updateDto)).rejects.toThrow(
        `Stock with ID ${stockId} not found`,
      );
    });

    it('should handle generic errors', async () => {
      const updateDto = {
        value: 150,
      };

      const error = new Error('Update failed');
      updateStockUseCaseExecuteSpy.mockRejectedValue(error);

      await expect(controller.update(stockId, updateDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update(stockId, updateDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });
});
