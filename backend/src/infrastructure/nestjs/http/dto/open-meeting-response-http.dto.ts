import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';
export class OpenMeetingResponseHttpDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  @IsDate()
  date: Date;
  @ApiProperty()
  @IsString()
  status: string;
  @ApiProperty()
  @IsString()
  notes: string | null;
  @ApiProperty()
  @IsDate()
  created_at: Date;
}
