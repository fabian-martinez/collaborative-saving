import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Loan Response HTTP DTO
 *
 * HTTP response DTO for loan creation.
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class CreateLoanResponseHttpDto {
  @ApiProperty({
    description: 'The unique identifier of the created loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  loan_id: string;

  @ApiProperty({
    description:
      'The unique identifier of the operation created for the loan disbursement',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  operation_id: string;

  @ApiProperty({
    description: 'The status of the loan',
    example: 'active',
    enum: ['pending', 'active', 'paid', 'defaulted'],
  })
  status: string;
}
