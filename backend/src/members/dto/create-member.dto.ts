import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({
    description: "The member's full name",
    example: 'Fabian Martinez',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "The member's email address",
    example: 'fabian@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "The member's identification number (optional)",
    example: '123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  identificationNumber?: string;
}
