import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CloseMeetingHttpDto {
  @ApiProperty({
    description: 'Name of the member authorizing the surplus accumulation',
    example: 'Juan Pérez',
    required: false,
  })
  @IsString()
  @IsOptional()
  authorizedBy?: string;
}
