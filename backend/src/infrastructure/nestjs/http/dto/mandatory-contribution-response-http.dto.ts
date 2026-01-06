import { ApiProperty } from '@nestjs/swagger';

/**
 * HTTP Response DTO for Mandatory Contribution
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 * This keeps the application layer clean while providing snake_case in API responses.
 */
export class MandatoryContributionResponseHttpDto {
  @ApiProperty({
    description: 'The unique identifier of the mandatory contribution',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'The type of asset for the contribution',
    example: 'cash',
  })
  asset_type: string;

  @ApiProperty({
    description: 'The required amount for this contribution type',
    example: 50000,
  })
  value: number;
}
