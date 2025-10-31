import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StocksV2Controller } from './stocks.v2.controller';
import { GetStocksQueryHandler } from '@application/queries/stocks/get-stocks.query-handler';
import { GetStockDetailQueryHandler } from '@application/queries/stocks/get-stock-detail.query-handler';
import { CreateStockUseCase } from '@application/use-cases/stocks/create-stock.use-case';
import { UpdateStockUseCase } from '@application/use-cases/stocks/update-stock.use-case';
import { StockResponseDto } from '@application/dto/stocks/stock-response.dto';
import { StockBehavior } from '@domain/entities/stock.entity';

describe('StocksV2Controller', () => {
  let controller: StocksV2Controller;
  let getStocksQuery: jest.Mocked<GetStocksQueryHandler>;
  let getStockDetailQuery: jest.Mocked<GetStockDetailQueryHandler>;
  let createStockUseCase: jest.Mocked<CreateStockUseCase>;
  let updateStockUseCase: jest.Mocked<UpdateStockUseCase>;

  let getStocksQueryExecuteSpy: jest.SpyInstance;
  let getStockDetailQueryExecuteSpy: jest.SpyInstance;
  let createStockUseCaseExecuteSpy: jest.SpyInstance;
  let updateStockUseCaseExecuteSpy: jest.SpyInstance;

  const mockStockResponse: StockResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'preferential',
    value: 100,
    monthlyContribution: 50,
    isGuaranteed: false,
    guaranteedYield: null,
    behavior: StockBehavior.CAPITAL_APPRECIATION,
    createdAt: new Date('2024-01-15'),
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
      ],
    }).compile();

    controller = module.get<StocksV2Controller>(StocksV2Controller);
    getStocksQuery = module.get(GetStocksQueryHandler);
    getStockDetailQuery = module.get(GetStockDetailQueryHandler);
    createStockUseCase = module.get(CreateStockUseCase);
    updateStockUseCase = module.get(UpdateStockUseCase);

    getStocksQueryExecuteSpy = jest.spyOn(getStocksQuery, 'execute');
    getStockDetailQueryExecuteSpy = jest.spyOn(getStockDetailQuery, 'execute');
    createStockUseCaseExecuteSpy = jest.spyOn(createStockUseCase, 'execute');
    updateStockUseCaseExecuteSpy = jest.spyOn(updateStockUseCase, 'execute');
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
          type: 'guaranteed',
          value: 150,
        },
      ];

      getStocksQueryExecuteSpy.mockResolvedValue(stocks);

      const result = await controller.list();

      expect(getStocksQueryExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(stocks);
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
      expect(result).toEqual(mockStockResponse);
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
      const createDto = {
        type: 'preferential',
        value: 100,
        monthlyContribution: 50,
      };

      createStockUseCaseExecuteSpy.mockResolvedValue(mockStockResponse);

      const result = await controller.create(createDto);

      expect(createStockUseCaseExecuteSpy).toHaveBeenCalledWith({
        type: 'preferential',
        value: 100,
        monthlyContribution: 50,
        isGuaranteed: undefined,
        guaranteedYield: undefined,
        behavior: undefined,
      });
      expect(result).toEqual(mockStockResponse);
    });

    it('should create a stock with all fields', async () => {
      const createDto = {
        type: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
      };

      const fullResponse: StockResponseDto = {
        ...mockStockResponse,
        type: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
      };

      createStockUseCaseExecuteSpy.mockResolvedValue(fullResponse);

      const result = await controller.create(createDto);

      expect(createStockUseCaseExecuteSpy).toHaveBeenCalledWith({
        type: 'guaranteed',
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: true,
        guaranteedYield: 0.02,
        behavior: StockBehavior.DIVIDEND_YIELD,
      });
      expect(result).toEqual(fullResponse);
    });

    it('should handle HttpException errors', async () => {
      const createDto = {
        type: 'preferential',
        value: 100,
        monthlyContribution: 50,
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
      const createDto = {
        type: 'preferential',
        value: 100,
        monthlyContribution: 50,
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
      };

      updateStockUseCaseExecuteSpy.mockResolvedValue(updatedResponse);

      const result = await controller.update(stockId, updateDto);

      expect(updateStockUseCaseExecuteSpy).toHaveBeenCalledWith(stockId, {
        type: undefined,
        value: 150,
        monthlyContribution: 75,
        isGuaranteed: undefined,
        guaranteedYield: undefined,
        behavior: undefined,
      });
      expect(result).toEqual(updatedResponse);
    });

    it('should update stock with all fields', async () => {
      const updateDto = {
        type: 'new-type',
        value: 200,
        monthlyContribution: 100,
        isGuaranteed: true,
        guaranteedYield: 0.03,
        behavior: StockBehavior.DIVIDEND_YIELD,
      };

      const updatedResponse: StockResponseDto = {
        ...mockStockResponse,
        ...updateDto,
      };

      updateStockUseCaseExecuteSpy.mockResolvedValue(updatedResponse);

      const result = await controller.update(stockId, updateDto);

      expect(updateStockUseCaseExecuteSpy).toHaveBeenCalledWith(stockId, {
        type: 'new-type',
        value: 200,
        monthlyContribution: 100,
        isGuaranteed: true,
        guaranteedYield: 0.03,
        behavior: StockBehavior.DIVIDEND_YIELD,
      });
      expect(result).toEqual(updatedResponse);
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
