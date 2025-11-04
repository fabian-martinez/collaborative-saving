import {
  IsOptional,
  IsEmail,
  IsString,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberHttpDto {
  @ApiProperty({
    description: "The member's full name",
    example: 'Fabian Martinez',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "The member's email address",
    example: 'fabian@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: "The member's identification number",
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  identification_number?: string;

  @ApiPropertyOptional({
    description: "The member's role",
    example: 'member',
    enum: ['member', 'admin', 'treasurer'],
    default: 'member',
  })
  @IsOptional()
  @IsString()
  @IsIn(['member', 'admin', 'treasurer'])
  role?: 'member' | 'admin' | 'treasurer';

  @ApiPropertyOptional({
    description: "The member's address",
    example: 'Calle Principal 123, Ciudad',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: "The member's phone number",
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: "The member's beneficiary",
    example: 'María Martínez',
  })
  @IsOptional()
  @IsString()
  beneficiary?: string;
}
