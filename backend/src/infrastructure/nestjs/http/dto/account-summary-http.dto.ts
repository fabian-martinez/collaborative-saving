import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccountType,
  ALL_ACCOUNT_TYPES,
} from '@domain/constants/account-types';
import { AccountLedgerEntryHttpDto } from './account-ledger-entry-http.dto';

/**
 * HTTP Response DTO for Account Summary
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class AccountSummaryHttpDto {
  @ApiProperty({ enum: ALL_ACCOUNT_TYPES })
  account_type: AccountType;

  @ApiPropertyOptional()
  account_name?: string;

  @ApiProperty({
    description:
      'Total balance calculated with ALL entries (not just the limited ones)',
  })
  total_balance: number;

  @ApiProperty({
    description: 'Total debits (positive amounts) calculated with ALL entries',
  })
  total_debits: number;

  @ApiProperty({
    description:
      'Total credits (negative amounts in absolute value) calculated with ALL entries',
  })
  total_credits: number;

  @ApiProperty({
    description: 'Total number of entries that affect this account',
  })
  entries_count: number;

  @ApiProperty({
    description:
      'Limited list of entries for display purposes only (ordered by date DESC)',
    type: [AccountLedgerEntryHttpDto],
  })
  entries: AccountLedgerEntryHttpDto[];

  @ApiProperty({
    description: 'Indicates if there are more entries beyond the limited list',
  })
  has_more_entries: boolean;
}
