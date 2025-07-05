import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({
    description: 'Optional notes for the meeting',
    example: 'Initial meeting of the year.',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
