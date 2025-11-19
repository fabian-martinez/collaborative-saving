import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Get Member Purchases Query HTTP DTO
 *
 * Query parameters for retrieving member stock purchases.
 */
export class GetMemberPurchasesQueryHttpDto {
  @ApiPropertyOptional({
    description: 'Filter by meeting ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meetingId?: string;
}
