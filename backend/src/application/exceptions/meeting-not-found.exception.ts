import { NotFoundError } from '@domain/errors/not-found.error';

/**
 * Meeting Not Found Exception
 *
 * Application-level exception for when a meeting is not found.
 * Extends NotFoundError for consistency with domain errors.
 */
export class MeetingNotFoundException extends NotFoundError {
  constructor(meetingId?: string) {
    super('Meeting', meetingId || 'unknown');
    this.name = 'MeetingNotFoundException';
  }
}
