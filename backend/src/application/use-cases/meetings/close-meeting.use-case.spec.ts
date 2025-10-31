import { CloseMeetingUseCase } from './close-meeting.use-case';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { Meeting, MeetingStatus } from '@domain/entities/meeting.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CloseMeetingUseCase', () => {
  let useCase: CloseMeetingUseCase;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;

  beforeEach(() => {
    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    } as unknown as jest.Mocked<MeetingRepository>;

    findByIdSpy = jest.spyOn(meetingRepository, 'findById');
    saveSpy = jest.spyOn(meetingRepository, 'save');

    useCase = new CloseMeetingUseCase(meetingRepository);
  });

  it('should close a meeting successfully', async () => {
    // ARRANGE
    const activeMeeting = Meeting.create({
      date: new Date('2024-01-15'),
      notes: 'Test meeting',
    });
    const meetingId = activeMeeting.id;

    meetingRepository.findById.mockResolvedValue(activeMeeting);
    // Mock save to return a closed version
    // The use case will call close() on the meeting, then save it
    meetingRepository.save.mockImplementation(async (meeting) => {
      // Return the same meeting object (already closed by use case)
      return await Promise.resolve(meeting);
    });

    // ACT
    const result = await useCase.execute({ meetingId });

    // ASSERT
    expect(findByIdSpy).toHaveBeenCalledWith(meetingId);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(MeetingStatus.CLOSED);
    expect(result.id).toBe(meetingId);
  });

  it('should throw NotFoundException if meeting does not exist', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    meetingRepository.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      `Meeting with ID ${meetingId} not found`,
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if meeting is already closed', async () => {
    // ARRANGE
    const meetingId = '550e8400-e29b-41d4-a716-446655440000';
    const closedMeeting = Meeting.create({});
    closedMeeting.close();

    meetingRepository.findById.mockResolvedValue(closedMeeting);

    // ACT & ASSERT
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      BadRequestException,
    );
    await expect(useCase.execute({ meetingId })).rejects.toThrow(
      'This meeting is already closed',
    );

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
