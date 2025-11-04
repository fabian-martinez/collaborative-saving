import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MeetingsV2Controller } from './meetings.v2.controller';
import { OpenMeetingUseCase } from '@application/use-cases/meetings/open-meeting.use-case';
import { CloseMeetingUseCase } from '@application/use-cases/meetings/close-meeting.use-case';
import { MeetingStatus } from '@domain/entities/meeting.entity';
import { OpenMeetingResponseHttpDto } from '../dto/open-meeting-response-http.dto';
import { MeetingResponseDto } from '@application/dto/meetings/meeting-response.dto';

describe('MeetingsV2Controller', () => {
  let controller: MeetingsV2Controller;
  let openMeetingUseCase: jest.Mocked<OpenMeetingUseCase>;
  let closeMeetingUseCase: jest.Mocked<CloseMeetingUseCase>;

  let openMeetingUseCaseExecuteSpy: jest.SpyInstance;
  let closeMeetingUseCaseExecuteSpy: jest.SpyInstance;

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
      ],
    }).compile();

    controller = module.get<MeetingsV2Controller>(MeetingsV2Controller);
    openMeetingUseCase = module.get(OpenMeetingUseCase);
    closeMeetingUseCase = module.get(CloseMeetingUseCase);

    openMeetingUseCaseExecuteSpy = jest.spyOn(openMeetingUseCase, 'execute');
    closeMeetingUseCaseExecuteSpy = jest.spyOn(closeMeetingUseCase, 'execute');
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
      await expect(controller.open(openDto)).rejects.toThrow(HttpException);
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
      await expect(controller.open(openDto)).rejects.toThrow(HttpException);
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
      await expect(controller.close(meetingId)).rejects.toThrow(HttpException);
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
      await expect(controller.close(meetingId)).rejects.toThrow(HttpException);
      await expect(controller.close(meetingId)).rejects.toThrow(
        'This meeting is already closed',
      );
    });

    it('should handle generic errors', async () => {
      // ARRANGE
      const error = new Error('Close failed');
      closeMeetingUseCaseExecuteSpy.mockRejectedValue(error);

      // ACT & ASSERT
      await expect(controller.close(meetingId)).rejects.toThrow(HttpException);
      await expect(controller.close(meetingId)).rejects.toThrow('Close failed');
    });
  });
});
