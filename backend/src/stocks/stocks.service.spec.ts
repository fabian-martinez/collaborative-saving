import { Test, TestingModule } from '@nestjs/testing';
import { StocksService } from './stocks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stock, StockBehavior } from './entities/stock.entity';
import { Repository } from 'typeorm';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';

describe('StocksService', () => {
  let service: StocksService;
  let stocksRepository: Repository<Stock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: getRepositoryToken(Stock),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(StockSubscription),
          useClass: Repository,
        },
        // Mocks mínimos para dependencias
        { provide: 'DataSource', useValue: {} },
        { provide: 'OperationsService', useValue: {} },
        { provide: 'MembersService', useValue: {} },
        { provide: 'LoansService', useValue: {} },
        { provide: 'StockSubscriptionsService', useValue: {} },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
    stocksRepository = module.get<Repository<Stock>>(getRepositoryToken(Stock));
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });
});
