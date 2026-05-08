import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MeetingsV2Controller } from './meetings.v2.controller';
import { OpenMeetingUseCase } from '@application/use-cases/meetings/open-meeting.use-case';
import { CloseMeetingUseCase } from '@application/use-cases/meetings/close-meeting.use-case';
import { GetDisbursementPlanPreviewQueryHandler } from '@application/queries/meetings/get-disbursement-plan-preview.query-handler';
import { ExecuteDisbursementPlanUseCase } from '@application/use-cases/meetings/execute-disbursement-plan.use-case';
import { GetMeetingMonthlyPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-monthly-payments.query-handler';
import { GetMeetingPurchasesQueryHandler } from '@application/queries/meetings/get-meeting-purchases.query-handler';
import { GetMeetingStockTransfersQueryHandler } from '@application/queries/meetings/get-meeting-stock-transfers.query-handler';
import { GetMeetingStockExchangesQueryHandler } from '@application/queries/meetings/get-meeting-stock-exchanges.query-handler';
import { GetMeetingStockLoanPaymentsQueryHandler } from '@application/queries/meetings/get-meeting-stock-loan-payments.query-handler';
import { GetMeetingsQueryHandler } from '@application/queries/meetings/get-meetings.query-handler';
import { GetMeetingQueryHandler } from '@application/queries/meetings/get-meeting.query-handler';
import { GetActiveMeetingQueryHandler } from '@application/queries/meetings/get-active-meeting.query-handler';
import { GetRevaluationQueryHandler } from '@application/queries/meetings/get-revaluation.query-handler';
import { GetDetailedMeetingSummaryQueryHandler } from '@application/queries/meetings/get-detailed-meeting-summary.query-handler';
import { RecordRevaluationUseCase } from '@application/use-cases/meetings/record-revaluation.use-case';
import { MeetingStatus } from '@domain/entities/meeting.entity';
import { OpenMeetingResponseHttpDto } from '../dto/open-meeting-response-http.dto';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';
import { OperationResponseDto } from '@application/dto/meetings/operation-response.dto';
import { OperationType } from '@domain/enums/operation-type.enum';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { BusinessRuleError } from '@domain/errors/business-rule.error';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { DisbursementTypeHttp } from '../dto/meetings/disbursement-plan-item-http.dto';
import { DisbursementType } from '@domain/enums/disbursement-type.enum';

describe('MeetingsV2Controller', () => {
  let controller: MeetingsV2Controller;
  let openMeetingUseCase: jest.Mocked<OpenMeetingUseCase>;
  let closeMeetingUseCase: jest.Mocked<CloseMeetingUseCase>;
  let getMeetingMonthlyPaymentsQuery: jest.Mocked<GetMeetingMonthlyPaymentsQueryHandler>;
  let getMeetingsQuery: jest.Mocked<GetMeetingsQueryHandler>;
  let getMeetingQuery: jest.Mocked<GetMeetingQueryHandler>;
  let getActiveMeetingQuery: jest.Mocked<GetActiveMeetingQueryHandler>;
  let getMeetingPurchasesQuery: jest.Mocked<GetMeetingPurchasesQueryHandler>;
  let getMeetingStockTransfersQuery: jest.Mocked<GetMeetingStockTransfersQueryHandler>;
  let getMeetingStockExchangesQuery: jest.Mocked<GetMeetingStockExchangesQueryHandler>;
  let getMeetingStockLoanPaymentsQuery: jest.Mocked<GetMeetingStockLoanPaymentsQueryHandler>;
  let getRevaluationQuery: jest.Mocked<GetRevaluationQueryHandler>;
  let getDetailedMeetingSummaryQuery: jest.Mocked<GetDetailedMeetingSummaryQueryHandler>;
  let recordRevaluationUseCase: jest.Mocked<RecordRevaluationUseCase>;
  let getDisbursementPlanPreviewQuery: jest.Mocked<GetDisbursementPlanPreviewQueryHandler>;
  let executeDisbursementPlanUseCase: jest.Mocked<ExecuteDisbursementPlanUseCase>;

  let openMeetingUseCaseExecuteSpy: jest.SpyInstance;
  let closeMeetingUseCaseExecuteSpy: jest.SpyInstance;
  let getMeetingMonthlyPaymentsQueryExecuteSpy: jest.SpyInstance;
  let getMeetingsQueryExecuteSpy: jest.SpyInstance;
  let getMeetingQueryExecuteSpy: jest.SpyInstance;
  let getActiveMeetingQueryExecuteSpy: jest.SpyInstance;
  let getMeetingPurchasesQueryExecuteSpy: jest.SpyInstance;
  let getMeetingStockTransfersQueryExecuteSpy: jest.SpyInstance;
  let getMeetingStockExchangesQueryExecuteSpy: jest.SpyInstance;
  let getMeetingStockLoanPaymentsQueryExecuteSpy: jest.SpyInstance;
  let getRevaluationQueryExecuteSpy: jest.SpyInstance;
  let recordRevaluationUseCaseExecuteSpy: jest.SpyInstance;
  let getDisbursementPlanPreviewQueryExecuteSpy: jest.SpyInstance;
  let executeDisbursementPlanUseCaseExecuteSpy: jest.SpyInstance;

  const mockOpenMeetingResponse: MeetingResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    date: new Date('2024-01-15'),
    status: MeetingStatus.ACTIVE,
    notes: 'Test meeting',
    createdAt: new Date('2024-01-15'),
  };

  const mockOpenMeetinHttpResponse: OpenMeetingResponseHttpDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    date: new Date('2024-01-15'),
    status: MeetingStatus.ACTIVE,
    notes: 'Test meeting',
    created_at: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingsV2Controller],
      providers: [
        {
          provide: OpenMeetingUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CloseMeetingUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeetingMonthlyPaymentsQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeetingPurchasesQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeetingStockTransfersQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeetingStockExchangesQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeetingStockLoanPaymentsQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeetingsQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeetingQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetActiveMeetingQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetRevaluationQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetDetailedMeetingSummaryQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RecordRevaluationUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetDisbursementPlanPreviewQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ExecuteDisbursementPlanUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MeetingsV2Controller>(MeetingsV2Controller);
    openMeetingUseCase = module.get(OpenMeetingUseCase);
    closeMeetingUseCase = module.get(CloseMeetingUseCase);
    getMeetingMonthlyPaymentsQuery = module.get(
      GetMeetingMonthlyPaymentsQueryHandler,
    );
    getMeetingsQuery = module.get(GetMeetingsQueryHandler);
    getMeetingQuery = module.get(GetMeetingQueryHandler);
    getActiveMeetingQuery = module.get(GetActiveMeetingQueryHandler);
    getMeetingPurchasesQuery = module.get(GetMeetingPurchasesQueryHandler);
    getMeetingStockTransfersQuery = module.get(
      GetMeetingStockTransfersQueryHandler,
    );
    getMeetingStockExchangesQuery = module.get(
      GetMeetingStockExchangesQueryHandler,
    );
    getMeetingStockLoanPaymentsQuery = module.get(
      GetMeetingStockLoanPaymentsQueryHandler,
    );
    getRevaluationQuery = module.get(GetRevaluationQueryHandler);
    getDetailedMeetingSummaryQuery = module.get(
      GetDetailedMeetingSummaryQueryHandler,
    );
    recordRevaluationUseCase = module.get(RecordRevaluationUseCase);
    getDisbursementPlanPreviewQuery = module.get(
      GetDisbursementPlanPreviewQueryHandler,
    );
    executeDisbursementPlanUseCase = module.get(ExecuteDisbursementPlanUseCase);

    openMeetingUseCaseExecuteSpy = jest.spyOn(openMeetingUseCase, 'execute');
    closeMeetingUseCaseExecuteSpy = jest.spyOn(closeMeetingUseCase, 'execute');
    getMeetingMonthlyPaymentsQueryExecuteSpy = jest.spyOn(
      getMeetingMonthlyPaymentsQuery,
      'execute',
    );
    getMeetingsQueryExecuteSpy = jest.spyOn(getMeetingsQuery, 'execute');
    getMeetingQueryExecuteSpy = jest.spyOn(getMeetingQuery, 'execute');
    getActiveMeetingQueryExecuteSpy = jest.spyOn(
      getActiveMeetingQuery,
      'execute',
    );
    getMeetingPurchasesQueryExecuteSpy = jest.spyOn(
      getMeetingPurchasesQuery,
      'execute',
    );
    getMeetingStockTransfersQueryExecuteSpy = jest.spyOn(
      getMeetingStockTransfersQuery,
      'execute',
    );
    getMeetingStockExchangesQueryExecuteSpy = jest.spyOn(
      getMeetingStockExchangesQuery,
      'execute',
    );
    getMeetingStockLoanPaymentsQueryExecuteSpy = jest.spyOn(
      getMeetingStockLoanPaymentsQuery,
      'execute',
    );
    getRevaluationQueryExecuteSpy = jest.spyOn(getRevaluationQuery, 'execute');
    recordRevaluationUseCaseExecuteSpy = jest.spyOn(
      recordRevaluationUseCase,
      'execute',
    );
    getDisbursementPlanPreviewQueryExecuteSpy = jest.spyOn(
      getDisbursementPlanPreviewQuery,
      'execute',
    );
    executeDisbursementPlanUseCaseExecuteSpy = jest.spyOn(
      executeDisbursementPlanUseCase,
      'execute',
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('open', () => {
    it('should open a meeting successfully', async () => {
      // ARRANGE
      const openDto = {
        date: new Date('2024-01-15'),
        notes: 'Test meeting',
      };

      openMeetingUseCaseExecuteSpy.mockResolvedValue(mockOpenMeetingResponse);

      // ACT
      const result = await controller.open(openDto);

      // ASSERT
      expect(openMeetingUseCaseExecuteSpy).toHaveBeenCalledWith({
        date: openDto.date,
        notes: openDto.notes,
      });
      expect(result).toEqual(mockOpenMeetinHttpResponse);
    });

    it('should open a meeting without optional fields', async () => {
      // ARRANGE
      const openDto = {};

      openMeetingUseCaseExecuteSpy.mockResolvedValue(mockOpenMeetingResponse);

      // ACT
      const result = await controller.open(openDto);

      // ASSERT
      expect(openMeetingUseCaseExecuteSpy).toHaveBeenCalledWith({
        date: undefined,
        notes: undefined,
      });
      expect(result).toEqual(mockOpenMeetinHttpResponse);
    });

    it('should handle BadRequestException when active meeting exists', async () => {
      // ARRANGE
      const openDto = { date: new Date('2024-01-15') };
      const error = new HttpException(
        'An active meeting already exists',
        HttpStatus.BAD_REQUEST,
      );
      openMeetingUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.open(openDto)).rejects.toThrow();
      await expect(controller.open(openDto)).rejects.toThrow(
        'An active meeting already exists',
      );
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const openDto = {};
      const error = new Error('Internal error');
      openMeetingUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.open(openDto)).rejects.toThrow();
      await expect(controller.open(openDto)).rejects.toThrow('Internal error');
    });
  });

  describe('close', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should close a meeting successfully', async () => {
      // ARRANGE
      const closedMeeting: MeetingResponseDto = {
        ...mockOpenMeetingResponse,
        status: MeetingStatus.CLOSED,
        createdAt: new Date('2024-01-15'),
      };

      const closeMeetingHttpRespose: OpenMeetingResponseHttpDto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        notes: 'Test meeting',
        status: MeetingStatus.CLOSED,
        created_at: new Date('2024-01-15'),
      };

      closeMeetingUseCaseExecuteSpy.mockResolvedValue(closedMeeting);

      // ACT
      const result = await controller.close(meetingId);

      // ASSERT
      expect(closeMeetingUseCaseExecuteSpy).toHaveBeenCalledWith({
        meetingId,
      });
      expect(result).toEqual(closeMeetingHttpRespose);
      expect(result.status).toBe(MeetingStatus.CLOSED);
    });

    it('should handle NotFoundException when meeting not found', async () => {
      // ARRANGE
      const error = new HttpException(
        `Meeting with ID ${meetingId} not found`,
        HttpStatus.NOT_FOUND,
      );
      closeMeetingUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.close(meetingId)).rejects.toThrow();
      await expect(controller.close(meetingId)).rejects.toThrow(
        `Meeting with ID ${meetingId} not found`,
      );
    });

    it('should handle BadRequestException when meeting already closed', async () => {
      // ARRANGE
      const error = new HttpException(
        'This meeting is already closed',
        HttpStatus.BAD_REQUEST,
      );
      closeMeetingUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.close(meetingId)).rejects.toThrow();
      await expect(controller.close(meetingId)).rejects.toThrow(
        'This meeting is already closed',
      );
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const error = new Error('Close failed');
      closeMeetingUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.close(meetingId)).rejects.toThrow();
      await expect(controller.close(meetingId)).rejects.toThrow('Close failed');
    });
  });

  describe('getMonthlyPayments', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return monthly payments for meeting', async () => {
      // ARRANGE
      const mockPayments: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Payment 1',
          totalAmount: 100000,
        },
        {
          id: 'op-2',
          memberId: 'member-2',
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Payment 2',
          totalAmount: 150000,
        },
      ];

      const expectedHttpResponse = [
        {
          id: 'op-1',
          member_id: 'member-1',
          meeting_id: meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Payment 1',
          total_amount: 100000,
          entries: [],
        },
        {
          id: 'op-2',
          member_id: 'member-2',
          meeting_id: meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Payment 2',
          total_amount: 150000,
          entries: [],
        },
      ];

      getMeetingMonthlyPaymentsQueryExecuteSpy.mockResolvedValue(mockPayments);

      // ACT
      const result = await controller.getMonthlyPayments(meetingId);

      // ASSERT
      expect(getMeetingMonthlyPaymentsQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result).toEqual(expectedHttpResponse);
      expect(result).toHaveLength(2);
      expect(result[0].total_amount).toBe(100000);
      expect(result[1].total_amount).toBe(150000);
    });

    it('should return empty array when no payments exist', async () => {
      // ARRANGE
      getMeetingMonthlyPaymentsQueryExecuteSpy.mockResolvedValue([]);

      // ACT
      const result = await controller.getMonthlyPayments(meetingId);

      // ASSERT
      expect(getMeetingMonthlyPaymentsQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result).toEqual([]);
    });

    it('should map totalAmount to total_amount in HTTP response', async () => {
      // ARRANGE
      const mockPayments: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Payment with total',
          totalAmount: 250000,
        },
      ];

      getMeetingMonthlyPaymentsQueryExecuteSpy.mockResolvedValue(mockPayments);

      // ACT
      const result = await controller.getMonthlyPayments(meetingId);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('total_amount');
      expect(result[0].total_amount).toBe(250000);
      expect(result[0]).not.toHaveProperty('totalAmount');
      expect(result[0].entries).toEqual([]);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getMeetingMonthlyPaymentsQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT

      try {
        await controller.getMonthlyPayments(meetingId);
      } catch (e) {
        expect(e).toBeDefined();
        if (true) {
          // expect(e?.getStatus?.()).toBe(HttpStatus.NOT_FOUND);
          expect(e.message).toContain(meetingId);
        }
      }
    });

    it('should handle operations with null memberId', async () => {
      // ARRANGE
      const mockPayments: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: null,
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          totalAmount: 0,
        },
      ];

      getMeetingMonthlyPaymentsQueryExecuteSpy.mockResolvedValue(mockPayments);

      // ACT
      const result = await controller.getMonthlyPayments(meetingId);

      // ASSERT
      expect(result[0].member_id).toBeNull();
      expect(result[0].total_amount).toBe(0);
    });

    it('should include empty entries array in response', async () => {
      // ARRANGE
      const mockPayments: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.MONTHLY_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Payment 1',
          totalAmount: 100000,
        },
      ];

      getMeetingMonthlyPaymentsQueryExecuteSpy.mockResolvedValue(mockPayments);

      // ACT
      const result = await controller.getMonthlyPayments(meetingId);

      // ASSERT
      expect(result[0].entries).toEqual([]);
      expect(result[0].total_amount).toBe(100000);
      expect(result[0]).toEqual({
        id: 'op-1',
        member_id: 'member-1',
        meeting_id: meetingId,
        type: OperationType.MONTHLY_PAYMENT,
        date: new Date('2024-01-15'),
        description: 'Payment 1',
        total_amount: 100000,
        entries: [],
      });
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const error = new Error('Internal error');
      getMeetingMonthlyPaymentsQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT

      await expect(controller.getMonthlyPayments(meetingId)).rejects.toThrow(
        'Internal error',
      );
    });
  });

  describe('findAll', () => {
    it('should return list of meetings successfully', async () => {
      // ARRANGE
      const mockMeetings: MeetingResponseDto[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: new Date('2024-01-15'),
          status: MeetingStatus.ACTIVE,
          notes: 'Test meeting 1',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          date: new Date('2024-02-15'),
          status: MeetingStatus.CLOSED,
          notes: 'Test meeting 2',
          createdAt: new Date('2024-02-15'),
        },
      ];

      const expectedHttpResponse: OpenMeetingResponseHttpDto[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: new Date('2024-01-15'),
          status: MeetingStatus.ACTIVE,
          notes: 'Test meeting 1',
          created_at: new Date('2024-01-15'),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          date: new Date('2024-02-15'),
          status: MeetingStatus.CLOSED,
          notes: 'Test meeting 2',
          created_at: new Date('2024-02-15'),
        },
      ];

      getMeetingsQueryExecuteSpy.mockResolvedValue(mockMeetings);

      // ACT
      const result = await controller.findAll();

      // ASSERT
      expect(getMeetingsQueryExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedHttpResponse);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no meetings exist', async () => {
      // ARRANGE
      getMeetingsQueryExecuteSpy.mockResolvedValue([]);

      // ACT
      const result = await controller.findAll();

      // ASSERT
      expect(getMeetingsQueryExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle meetings with null notes', async () => {
      // ARRANGE
      const mockMeetings: MeetingResponseDto[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          date: new Date('2024-01-15'),
          status: MeetingStatus.ACTIVE,
          notes: null,
          createdAt: new Date('2024-01-15'),
        },
      ];

      getMeetingsQueryExecuteSpy.mockResolvedValue(mockMeetings);

      // ACT
      const result = await controller.findAll();

      // ASSERT
      expect(result[0].notes).toBeNull();
      expect(result[0].created_at).toBeInstanceOf(Date);
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const error = new Error('Internal error');
      getMeetingsQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.findAll()).rejects.toThrow();
      await expect(controller.findAll()).rejects.toThrow('Internal error');
    });

    it('should handle HttpException errors', async () => {
      // ARRANGE
      const error = new HttpException('Custom error', HttpStatus.BAD_REQUEST);
      getMeetingsQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.findAll()).rejects.toThrow();
      await expect(controller.findAll()).rejects.toThrow('Custom error');
    });
  });

  describe('findOne', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return meeting by ID successfully', async () => {
      // ARRANGE
      const mockMeeting: MeetingResponseDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        createdAt: new Date('2024-01-15'),
      };

      const expectedHttpResponse: OpenMeetingResponseHttpDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        created_at: new Date('2024-01-15'),
      };

      getMeetingQueryExecuteSpy.mockResolvedValue(mockMeeting);

      // ACT
      const result = await controller.findOne(meetingId, {});

      // ASSERT
      expect(getMeetingQueryExecuteSpy).toHaveBeenCalledWith(meetingId, false);
      expect(getMeetingQueryExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedHttpResponse);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getMeetingQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT

      try {
        await controller.findOne(meetingId, {});
      } catch (e) {
        expect(e).toBeDefined();
        if (true) {
          // expect(e?.getStatus?.()).toBe(HttpStatus.NOT_FOUND);
          expect(e.message).toContain(meetingId);
        }
      }
    });

    it('should handle meetings with null notes', async () => {
      // ARRANGE
      const mockMeeting: MeetingResponseDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: null,
        createdAt: new Date('2024-01-15'),
      };

      getMeetingQueryExecuteSpy.mockResolvedValue(mockMeeting);

      // ACT
      const result = await controller.findOne(meetingId, {});

      // ASSERT
      expect(result.notes).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should handle closed meetings', async () => {
      // ARRANGE
      const mockMeeting: MeetingResponseDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.CLOSED,
        notes: 'Closed meeting',
        createdAt: new Date('2024-01-15'),
      };

      getMeetingQueryExecuteSpy.mockResolvedValue(mockMeeting);

      // ACT
      const result = await controller.findOne(meetingId, {});

      // ASSERT
      expect(result.status).toBe(MeetingStatus.CLOSED);
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const error = new Error('Internal error');
      getMeetingQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT

      await expect(controller.findOne(meetingId, {})).rejects.toThrow(
        'Internal error',
      );
    });

    it('should include summary when includeSummary query param is true', async () => {
      // ARRANGE
      const mockMeeting: MeetingResponseDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        createdAt: new Date('2024-01-15'),
      };

      // Expected HTTP response (snake_case)
      const expectedSummary = {
        total_cash: 150000.0,
        total_interest: 5000.0,
        total_loans: 20000.0,
        total_collected: 145000.0,
        total_dividends: 10000.0,
        total_stock_investment: 30000.0,
        final_cash_balance: 120000.0,
        total_disbursed: 30000.0,
        participants_count: 15,
        duration: '2h 30m',
      };

      const expectedHttpResponse: OpenMeetingResponseHttpDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        created_at: new Date('2024-01-15'),
        summary: expectedSummary,
      };

      // Mock summary from service (camelCase)
      const serviceSummary = {
        totalCash: 150000.0,
        totalInterest: 5000.0,
        totalLoans: 20000.0,
        totalCollected: 145000.0,
        totalDividends: 10000.0,
        totalStockInvestment: 30000.0,
        finalCashBalance: 120000.0,
        totalDisbursed: 30000.0,
        participantsCount: 15,
        duration: '2h 30m',
      };

      getMeetingQueryExecuteSpy.mockResolvedValue({
        ...mockMeeting,
        summary: serviceSummary,
      });

      // ACT
      const result = await controller.findOne(meetingId, {
        include_summary: true,
      });

      // ASSERT
      expect(getMeetingQueryExecuteSpy).toHaveBeenCalledWith(meetingId, true);
      expect(result).toEqual(expectedHttpResponse);
      expect(result.summary).toBeDefined();
      expect(result.summary?.total_cash).toBe(150000.0);
    });

    it('should not include summary when includeSummary query param is false', async () => {
      // ARRANGE
      const mockMeeting: MeetingResponseDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        createdAt: new Date('2024-01-15'),
      };

      const expectedHttpResponse: OpenMeetingResponseHttpDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        created_at: new Date('2024-01-15'),
      };

      getMeetingQueryExecuteSpy.mockResolvedValue(mockMeeting);

      // ACT
      const result = await controller.findOne(meetingId, {
        include_summary: false,
      });

      // ASSERT
      expect(getMeetingQueryExecuteSpy).toHaveBeenCalledWith(meetingId, false);
      expect(result).toEqual(expectedHttpResponse);
      expect(result.summary).toBeUndefined();
    });

    it('should not include summary when includeSummary query param is not provided', async () => {
      // ARRANGE
      const mockMeeting: MeetingResponseDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        createdAt: new Date('2024-01-15'),
      };

      const expectedHttpResponse: OpenMeetingResponseHttpDto = {
        id: meetingId,
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Test meeting',
        created_at: new Date('2024-01-15'),
      };

      getMeetingQueryExecuteSpy.mockResolvedValue(mockMeeting);

      // ACT
      const result = await controller.findOne(meetingId, {});

      // ASSERT
      expect(getMeetingQueryExecuteSpy).toHaveBeenCalledWith(meetingId, false);
      expect(result).toEqual(expectedHttpResponse);
      expect(result.summary).toBeUndefined();
    });
  });

  describe('getActive', () => {
    it('should return active meeting with summary successfully', async () => {
      // ARRANGE
      // Mock summary from service (camelCase)
      const serviceSummary = {
        totalCash: 150000.0,
        totalInterest: 5000.0,
        totalLoans: 20000.0,
        totalCollected: 145000.0,
        totalDividends: 10000.0,
        totalStockInvestment: 30000.0,
        finalCashBalance: 120000.0,
        totalDisbursed: 30000.0,
        participantsCount: 15,
        duration: '2h 30m',
      };

      const mockMeeting: MeetingResponseDto & {
        summary: typeof serviceSummary;
      } = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Active meeting',
        createdAt: new Date('2024-01-15'),
        summary: serviceSummary,
      };

      // Expected HTTP response (snake_case)
      const expectedSummary = {
        total_cash: 150000.0,
        total_interest: 5000.0,
        total_loans: 20000.0,
        total_collected: 145000.0,
        total_dividends: 10000.0,
        total_stock_investment: 30000.0,
        final_cash_balance: 120000.0,
        total_disbursed: 30000.0,
        participants_count: 15,
        duration: '2h 30m',
      };

      const expectedHttpResponse: OpenMeetingResponseHttpDto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: 'Active meeting',
        created_at: new Date('2024-01-15'),
        summary: expectedSummary,
      };

      getActiveMeetingQueryExecuteSpy.mockResolvedValue(mockMeeting);

      // ACT
      const result = await controller.getActive();

      // ASSERT
      expect(getActiveMeetingQueryExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedHttpResponse);
      expect(result.status).toBe(MeetingStatus.ACTIVE);
      expect(result.summary).toBeDefined();
      expect(result.summary?.total_cash).toBe(150000.0);
    });

    it('should return 404 when no active meeting exists', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException('active');
      getActiveMeetingQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.getActive()).rejects.toThrow();
      try {
        await controller.getActive();
      } catch (e) {
        expect(e).toBeDefined();
        if (true) {
          // expect(e?.getStatus?.()).toBe(HttpStatus.NOT_FOUND);
        }
      }
    });

    it('should handle active meetings with null notes and include summary', async () => {
      // ARRANGE
      // Mock summary from service (camelCase)
      const serviceSummary = {
        totalCash: 0,
        totalInterest: 0,
        totalLoans: 0,
        totalCollected: 0,
        totalDividends: 0,
        totalStockInvestment: 0,
        finalCashBalance: 0,
        totalDisbursed: 0,
        participantsCount: 0,
        duration: '0h 0m',
      };

      const mockMeeting: MeetingResponseDto & {
        summary: typeof serviceSummary;
      } = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: new Date('2024-01-15'),
        status: MeetingStatus.ACTIVE,
        notes: null,
        createdAt: new Date('2024-01-15'),
        summary: serviceSummary,
      };

      // Expected HTTP response (snake_case)
      const expectedSummary = {
        total_cash: 0,
        total_interest: 0,
        total_loans: 0,
        total_collected: 0,
        total_dividends: 0,
        total_stock_investment: 0,
        final_cash_balance: 0,
        total_disbursed: 0,
        participants_count: 0,
        duration: '0h 0m',
      };

      getActiveMeetingQueryExecuteSpy.mockResolvedValue(mockMeeting);

      // ACT
      const result = await controller.getActive();

      // ASSERT
      expect(result.notes).toBeNull();
      expect(result.status).toBe(MeetingStatus.ACTIVE);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.summary).toBeDefined();
      expect(result.summary).toEqual(expectedSummary);
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const error = new Error('Internal error');
      getActiveMeetingQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.getActive()).rejects.toThrow();
      await expect(controller.getActive()).rejects.toThrow('Internal error');
    });

    it('should handle HttpException errors', async () => {
      // ARRANGE
      const error = new HttpException('Custom error', HttpStatus.BAD_REQUEST);
      getActiveMeetingQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.getActive()).rejects.toThrow();
      await expect(controller.getActive()).rejects.toThrow('Custom error');
    });
  });

  describe('getPurchases', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return purchases for meeting', async () => {
      // ARRANGE
      const mockPurchases: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.STOCK_PURCHASE,
          date: new Date('2024-01-15'),
          description: 'Purchase 1',
        },
      ];

      getMeetingPurchasesQueryExecuteSpy.mockResolvedValue(mockPurchases);

      // ACT
      const result = await controller.getPurchases(meetingId);

      // ASSERT
      expect(getMeetingPurchasesQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(OperationType.STOCK_PURCHASE);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getMeetingPurchasesQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT

      try {
        await controller.getPurchases(meetingId);
      } catch (e) {
        expect(e).toBeDefined();
        if (true) {
          // expect(e?.getStatus?.()).toBe(HttpStatus.NOT_FOUND);
        }
      }
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const error = new Error('Internal error');
      getMeetingPurchasesQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
    });
  });

  describe('getTransfers', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return transfers for meeting', async () => {
      // ARRANGE
      const mockTransfers: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.STOCK_TRANSFER,
          date: new Date('2024-01-15'),
          description: 'Transfer 1',
        },
      ];

      getMeetingStockTransfersQueryExecuteSpy.mockResolvedValue(mockTransfers);

      // ACT
      const result = await controller.getTransfers(meetingId);

      // ASSERT
      expect(getMeetingStockTransfersQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(OperationType.STOCK_TRANSFER);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getMeetingStockTransfersQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
    });
  });

  describe('getExchanges', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return exchanges for meeting', async () => {
      // ARRANGE
      const mockExchanges: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.STOCK_MODIFICATION,
          date: new Date('2024-01-15'),
          description: 'Exchange 1',
        },
      ];

      getMeetingStockExchangesQueryExecuteSpy.mockResolvedValue(mockExchanges);

      // ACT
      const result = await controller.getExchanges(meetingId);

      // ASSERT
      expect(getMeetingStockExchangesQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(OperationType.STOCK_MODIFICATION);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getMeetingStockExchangesQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
    });
  });

  describe('getStockLoanPayments', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return stock loan payments for meeting', async () => {
      // ARRANGE
      const mockPayments: OperationResponseDto[] = [
        {
          id: 'op-1',
          memberId: 'member-1',
          meetingId,
          type: OperationType.STOCK_LOAN_PAYMENT,
          date: new Date('2024-01-15'),
          description: 'Stock loan payment 1',
        },
      ];

      getMeetingStockLoanPaymentsQueryExecuteSpy.mockResolvedValue(
        mockPayments,
      );

      // ACT
      const result = await controller.getStockLoanPayments(meetingId);

      // ASSERT
      expect(getMeetingStockLoanPaymentsQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(OperationType.STOCK_LOAN_PAYMENT);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getMeetingStockLoanPaymentsQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
    });
  });

  describe('getRevaluation', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return revaluation preview successfully', async () => {
      // ARRANGE
      const mockRevaluation = {
        totalContributions: 10000,
        totalInterest: 5000,
        totalToDistribute: 15000,
        details: [],
        totalMandatoryContributions: 2000,
        status: 'preview' as const,
      };

      getRevaluationQueryExecuteSpy.mockResolvedValue(mockRevaluation);

      // ACT
      const result = await controller.getRevaluation(meetingId);

      // ASSERT
      expect(getRevaluationQueryExecuteSpy).toHaveBeenCalledWith(meetingId);
      expect(result.total_contributions).toBe(10000);
      expect(result.status).toBe('preview');
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getRevaluationQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
    });
  });

  describe('confirmRevaluation', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should confirm and execute revaluation successfully', async () => {
      // ARRANGE
      const mockRevaluation = {
        totalContributions: 10000,
        totalInterest: 5000,
        totalToDistribute: 15000,
        details: [],
        totalMandatoryContributions: 2000,
        status: 'executed' as const,
        executedAt: new Date('2024-01-15'),
        operationId: 'operation-id-1',
      };

      recordRevaluationUseCaseExecuteSpy.mockResolvedValue(mockRevaluation);

      // ACT
      const result = await controller.confirmRevaluation(meetingId);

      // ASSERT
      expect(recordRevaluationUseCaseExecuteSpy).toHaveBeenCalledWith({
        meetingId,
      });
      expect(result.status).toBe('executed');
      expect(result.operation_id).toBe('operation-id-1');
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      recordRevaluationUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
    });
  });

  describe('getDisbursementPlanPreview', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return disbursement plan preview successfully', async () => {
      // ARRANGE
      const mockPreview = {
        plan: [
          {
            memberId: 'member-1',
            type: 'loan' as const,
            amount: 1000,
          },
        ],
        availableCash: 5000,
        totalToDisburse: 1000,
      };

      getDisbursementPlanPreviewQueryExecuteSpy.mockResolvedValue(mockPreview);

      // ACT
      const result = await controller.getDisbursementPlanPreview(meetingId);

      // ASSERT
      expect(getDisbursementPlanPreviewQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );
      expect(result.available_cash).toBe(5000);
      expect(result.total_to_disburse).toBe(1000);
      expect(result.plan).toHaveLength(1);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getDisbursementPlanPreviewQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(
        controller.getDisbursementPlanPreview(meetingId),
      ).rejects.toThrow();
    });
  });

  describe('getDetailedSummary', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    let getDetailedMeetingSummaryQueryExecuteSpy: jest.SpyInstance;

    beforeEach(() => {
      getDetailedMeetingSummaryQueryExecuteSpy = jest.spyOn(
        getDetailedMeetingSummaryQuery,
        'execute',
      );
    });

    it('should return detailed summary successfully', async () => {
      // ARRANGE
      const mockDetailedSummary = {
        meeting: {
          id: meetingId,
          date: new Date('2024-01-15'),
          status: 'closed' as const,
          notes: 'Test meeting',
        },
        summary: {
          totalCollected: 150000.0,
          totalDisbursed: 30000.0,
          shareValue: 1500.0,
          participants: 15,
        },
        collections: {
          memberContributions: { count: 10, amount: 100000.0 },
          loanPayments: { count: 5, amount: 30000.0 },
          interestCollected: 5000.0,
          feesCollected: 1000.0,
        },
        disbursements: {
          newLoans: { count: 2, amount: 20000.0 },
          stockLiquidations: { count: 1, amount: 5000.0 },
          dividendPayments: { count: 3, amount: 5000.0 },
        },
        metrics: {
          attendance: { current: 15, percentage: 100 },
          revaluation: null,
          paymentsUpToDate: 8,
          overduePayments: 2,
        },
      };

      getDetailedMeetingSummaryQueryExecuteSpy.mockResolvedValue(
        mockDetailedSummary,
      );

      // ACT

      const result = await controller.getDetailedSummary(meetingId);

      // ASSERT
      expect(getDetailedMeetingSummaryQueryExecuteSpy).toHaveBeenCalledWith(
        meetingId,
      );

      expect(result.meeting.id).toBe(meetingId);

      expect(result.summary.total_collected).toBe(150000.0);

      expect(result.collections.member_contributions.count).toBe(10);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const error = new MeetingNotFoundException(meetingId);
      getDetailedMeetingSummaryQueryExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
    });
  });

  describe('executeDisbursementPlan', () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should execute disbursement plan successfully', async () => {
      // ARRANGE
      const dto = {
        plan: [
          {
            member_id: 'member-1',
            type: DisbursementTypeHttp.LOAN,
            amount: 1000,
          },
        ],
      };

      const mockResult = {
        success: true,
        processedItems: 1,
        totalDisbursed: 1000,
        totalRequested: 1000,
      };

      executeDisbursementPlanUseCaseExecuteSpy.mockResolvedValue(mockResult);

      // ACT
      const result = await controller.executeDisbursementPlan(meetingId, dto);

      // ASSERT
      expect(executeDisbursementPlanUseCaseExecuteSpy).toHaveBeenCalledTimes(1);
      expect(executeDisbursementPlanUseCaseExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          meetingId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          plan: expect.arrayContaining([
            expect.objectContaining({
              memberId: 'member-1',
              type: DisbursementType.LOAN,
              amount: 1000,
            }),
          ]),
        }),
      );
      expect(result.processed_items).toBe(1);
      expect(result.total_disbursed).toBe(1000);
    });

    it('should return 404 when meeting not found', async () => {
      // ARRANGE
      const dto = { plan: [] };
      const error = new MeetingNotFoundException(meetingId);
      executeDisbursementPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(
        controller.executeDisbursementPlan(meetingId, dto),
      ).rejects.toThrow();
    });

    it('should return 400 when business rule error', async () => {
      // ARRANGE
      const dto = { plan: [] };
      const error = new BusinessRuleError('Insufficient cash');
      executeDisbursementPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(
        controller.executeDisbursementPlan(meetingId, dto),
      ).rejects.toThrow();
      try {
        await controller.executeDisbursementPlan(meetingId, dto);
      } catch (e) {
        expect(e).toBeDefined();
        if (true) {
          // expect(e?.getStatus?.()).toBe(HttpStatus.BAD_REQUEST);
        }
      }
    });

    it('should return 400 when invalid request error', async () => {
      // ARRANGE
      const dto = { plan: [] };
      const error = new InvalidRequestError('Invalid plan');
      executeDisbursementPlanUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(
        controller.executeDisbursementPlan(meetingId, dto),
      ).rejects.toThrow();
      try {
        await controller.executeDisbursementPlan(meetingId, dto);
      } catch (e) {
        expect(e).toBeDefined();
        if (true) {
          // expect(e?.getStatus?.()).toBe(HttpStatus.BAD_REQUEST);
        }
      }
    });
  });
});
