import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Get Member Stock Modifications Query HTTP DTO
 *
 * Query parameters for retrieving member stock modifications (exchanges, transfers, loan payments).
 */
export class GetMemberStockModificationsQueryHttpDto {
  @ApiPropertyOptional({
    description: 'Filter by meeting ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meetingId?: string;
}
