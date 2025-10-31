import { Meeting } from '@domain/entities/meeting.entity';

export interface MeetingRepository {
  findById(id: string): Promise<Meeting | null>;
  findActive(): Promise<Meeting | null>;
  findAll(): Promise<Meeting[]>;
  save(meeting: Meeting): Promise<Meeting>;
  findLatestClosed(): Promise<Meeting | null>;
}
