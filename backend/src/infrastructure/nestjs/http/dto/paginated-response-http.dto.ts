import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaHttpDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedResponseHttpDto<T> {
  @ApiProperty({ type: [Object] })
  data: T[];

  @ApiProperty({ type: PaginationMetaHttpDto })
  pagination: PaginationMetaHttpDto;
}
