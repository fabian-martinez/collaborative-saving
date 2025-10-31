import { Test, TestingModule } from '@nestjs/testing';
import { StocksService } from './stocks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { Repository, DataSource } from 'typeorm';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { MembersService } from '../members/members.service';
import { LoansService } from '../loans/loans.service';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';

describe('StocksService', () => {
  let service: StocksService;
  let stocksRepository: jest.Mocked<Repository<Stock>>;
  let stockSubscriptionsRepository: jest.Mocked<Repository<StockSubscription>>;
  let dataSource: jest.Mocked<DataSource>;
  let membersService: jest.Mocked<MembersService>;
  let loansService: jest.Mocked<LoansService>;
  let stockSubscriptionsService: jest.Mocked<StockSubscriptionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: getRepositoryToken(Stock),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockSubscription),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
        {
          provide: MembersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: LoansService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StockSubscriptionsService,
          useValue: {
            findAllWithDetails: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
    stocksRepository = module.get(getRepositoryToken(Stock));
    stockSubscriptionsRepository = module.get(
      getRepositoryToken(StockSubscription),
    );
    dataSource = module.get(DataSource);
    membersService = module.get(MembersService);
    loansService = module.get(LoansService);
    stockSubscriptionsService = module.get(StockSubscriptionsService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });
});
