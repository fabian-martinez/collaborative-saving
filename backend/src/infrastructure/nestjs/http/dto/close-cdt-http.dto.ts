import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CloseCdtHttpDto {
  @ApiPropertyOptional({
    description: 'Optional meeting ID to link the disbursement',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsOptional()
  meeting_id?: string;
}
