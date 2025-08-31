import { ApiProperty } from '@nestjs/swagger';
import { MemberDetailResponseDto } from './member-detail-response.dto';
import { MemberStocksResponseDto } from './member-stocks-response.dto';
import { MemberLoansResponseDto } from './member-loans-response.dto';
import { DebtCapacityResponseDto } from './debt-capacity-response.dto';

export class MemberSummaryResponseDto {
  @ApiProperty({
    description: 'Member basic information',
    type: MemberDetailResponseDto,
  })
  member: MemberDetailResponseDto;

  @ApiProperty({
    description: 'Member stocks summary',
    type: MemberStocksResponseDto,
  })
  stocks: MemberStocksResponseDto;

  @ApiProperty({
    description: 'Member loans summary',
    type: MemberLoansResponseDto,
  })
  loans: MemberLoansResponseDto;

  @ApiProperty({
    description: 'Member debt capacity',
    type: DebtCapacityResponseDto,
  })
  debtCapacity: DebtCapacityResponseDto;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastUpdated: Date;
}
