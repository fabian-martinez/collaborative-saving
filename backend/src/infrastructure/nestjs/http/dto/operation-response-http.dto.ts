import { ApiProperty } from '@nestjs/swagger';

/**
 * HTTP Response DTO for Operation
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 * This keeps the application layer clean while providing snake_case in API responses.
 */
export class OperationResponseHttpDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false, nullable: true })
  member_id: string | null;

  @ApiProperty()
  meeting_id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  date: Date | string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;
}
