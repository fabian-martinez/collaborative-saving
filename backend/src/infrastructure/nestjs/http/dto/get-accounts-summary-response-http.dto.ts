import { ApiProperty } from '@nestjs/swagger';
import { AccountSummaryHttpDto } from './account-summary-http.dto';

export class DateRangeHttpDto {
  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;
}

export class AccountsSummaryMetadataHttpDto {
  @ApiProperty()
  query_date: Date;

  @ApiProperty({ required: false, type: DateRangeHttpDto })
  date_range?: DateRangeHttpDto;

  @ApiProperty()
  entries_limit: number;
}

export class AccountsSummarySummaryHttpDto {
  @ApiProperty()
  total_accounts: number;

  @ApiProperty()
  total_debits: number;

  @ApiProperty()
  total_credits: number;

  @ApiProperty()
  net_balance: number;
}

export class GetAccountsSummaryResponseHttpDto {
  @ApiProperty({ type: [AccountSummaryHttpDto] })
  accounts: AccountSummaryHttpDto[];

  @ApiProperty()
  summary: AccountsSummarySummaryHttpDto;

  @ApiProperty()
  metadata: AccountsSummaryMetadataHttpDto;
}

