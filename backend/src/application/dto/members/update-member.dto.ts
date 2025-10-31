import { IsOptional, IsEmail, IsString, IsIn } from 'class-validator';

export class UpdateMemberDto {
  memberId!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(['member', 'admin', 'treasurer'])
  role?: 'member' | 'admin' | 'treasurer';

  @IsOptional()
  @IsString()
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  beneficiary?: string;
}
