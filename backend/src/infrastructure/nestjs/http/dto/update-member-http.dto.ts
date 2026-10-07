import { IsOptional, IsEmail, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMemberHttpDto {
  @ApiPropertyOptional({
    description: "The member's full name",
    example: 'Fabian Martinez',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "The member's email address",
    example: 'fabian@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "The member's role",
    example: 'member',
    enum: ['member', 'admin', 'treasurer'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['member', 'admin', 'treasurer'])
  role?: 'member' | 'admin' | 'treasurer';

  @ApiPropertyOptional({
    description: "The member's identification number",
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  identification_number?: string;

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
