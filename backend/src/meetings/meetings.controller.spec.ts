import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { AssetRevaluationService } from '../asset-revaluation/asset-revaluation.service';

describe('MeetingsController', () => {
  let controller: MeetingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingsController],
      providers: [
        {
          provide: MeetingsService,
          useValue: {
            findAll: jest.fn(),
            findActive: jest.fn(),
            create: jest.fn(),
            close: jest.fn(),
            findMonthlyPaymentsByMeeting: jest.fn(),
            recordMonthlyPayment: jest.fn(),
            buyStockForMember: jest.fn(),
            withdrawStockForMember: jest.fn(),
            getDisbursementPlanPreview: jest.fn(),
            executeDisbursementPlan: jest.fn(),
            getMeetingSummary: jest.fn(),
          },
        },
        {
          provide: AssetRevaluationService,
          useValue: {
            getRevaluationPreview: jest.fn(),
            executeRevaluation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MeetingsController>(MeetingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
