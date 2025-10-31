import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class OpenMeetingHttpDto {
  @ApiProperty({
    description: 'The date of the meeting',
    example: '2024-01-15T10:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date?: Date;

  @ApiProperty({
    description: 'Optional notes for the meeting',
    example: 'Initial meeting of the year.',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string | null;
}
