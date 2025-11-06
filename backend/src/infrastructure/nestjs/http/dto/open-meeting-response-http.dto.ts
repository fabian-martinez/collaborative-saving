import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MeetingSummaryHttpDto } from './meeting-summary-http.dto';

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
  @ApiPropertyOptional({
    type: MeetingSummaryHttpDto,
    description: 'Resumen de la reunión (incluido solo si includeSummary=true)',
  })
  @ValidateNested()
  @Type(() => MeetingSummaryHttpDto)
  summary?: MeetingSummaryHttpDto;
}
