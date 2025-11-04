import { ApiProperty } from '@nestjs/swagger';

/**
 * HTTP Response DTO for Member
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 * This keeps the application layer clean while providing snake_case in API responses.
 */
export class MemberResponseHttpDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ required: false })
  identification_number?: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  beneficiary?: string;

  @ApiProperty()
  registration_date: Date | string;

  @ApiProperty({ required: false })
  created_at?: Date | string;
}
