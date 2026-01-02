import { ApiProperty } from '@nestjs/swagger';
import { AccountSummaryHttpDto } from './account-summary-http.dto';

export class DateRangeHttpDto {
  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;
}

export class AccountsSummaryMetadataHttpDto {
  @ApiProperty()
  queryDate: Date;

  @ApiProperty({ required: false, type: DateRangeHttpDto })
  dateRange?: DateRangeHttpDto;

  @ApiProperty()
  entriesLimit: number;
}

export class AccountsSummarySummaryHttpDto {
  @ApiProperty()
  totalAccounts: number;

  @ApiProperty()
  totalDebits: number;

  @ApiProperty()
  totalCredits: number;

  @ApiProperty()
  netBalance: number;
}

export class GetAccountsSummaryResponseHttpDto {
  @ApiProperty({ type: [AccountSummaryHttpDto] })
  accounts: AccountSummaryHttpDto[];

  @ApiProperty()
  summary: AccountsSummarySummaryHttpDto;

  @ApiProperty()
  metadata: AccountsSummaryMetadataHttpDto;
}

