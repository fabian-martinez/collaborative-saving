export class MeetingResponseDto {
  id: string;
  date: Date;
  status: string;
  notes: string | null;
  createdAt: Date;
}
