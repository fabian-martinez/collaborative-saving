import { ApiProperty } from '@nestjs/swagger';

export class GetPortfolioStatusResponseHttpDto {
  @ApiProperty({
    description: 'Number of up-to-date loans',
    example: 85,
  })
  up_to_date: number;

  @ApiProperty({
    description: 'Number of overdue loans',
    example: 10,
  })
  overdue: number;

  @ApiProperty({
    description: 'Number of written-off loans',
    example: 5,
  })
  written_off: number;
}
