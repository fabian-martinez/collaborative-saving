import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MemberResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: "The member's full name",
    example: 'Fabian Martinez',
  })
  name: string;

  @ApiProperty({
    description: "The member's email address",
    example: 'fabian@example.com',
  })
  email: string;

  @ApiProperty({
    description: "The member's role",
    example: 'member',
    enum: ['member', 'admin', 'treasurer'],
  })
  role: string;

  @ApiPropertyOptional({
    description: "The member's identification number",
    example: '123456789',
  })
  identificationNumber?: string;

  @ApiProperty({
    description: "The member's status",
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status: string;

  @ApiPropertyOptional({
    description: "The member's address",
    example: 'Calle Principal 123, Ciudad',
  })
  address?: string;

  @ApiPropertyOptional({
    description: "The member's phone number",
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: "The member's beneficiary",
    example: 'María Martínez',
  })
  beneficiary?: string;

  @ApiProperty({
    description: "The member's registration date",
    example: '2023-01-15',
  })
  registrationDate: Date | string;

  @ApiPropertyOptional({
    description: "The member's creation timestamp",
    example: '2023-01-15T10:30:00Z',
  })
  createdAt?: Date | string;
}
