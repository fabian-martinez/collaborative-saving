import { ApiProperty } from '@nestjs/swagger';

export class NewStockValueDto {
  @ApiProperty({
    description: 'The type of the stock',
    example: 'preferential',
  })
  type: string;

  @ApiProperty({
    description: 'The new, revaluated value of the stock',
    example: 115.5,
  })
  value: number;
}
