import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, ALL_ACCOUNT_TYPES } from '@domain/constants/account-types';
import { AccountLedgerEntryHttpDto } from './account-ledger-entry-http.dto';

export class AccountSummaryHttpDto {
  @ApiProperty({ enum: ALL_ACCOUNT_TYPES })
  accountType: AccountType;

  @ApiPropertyOptional()
  accountName?: string;

  @ApiProperty({
    description: 'Total balance calculated with ALL entries (not just the limited ones)',
  })
  totalBalance: number;

  @ApiProperty({
    description: 'Total debits (positive amounts) calculated with ALL entries',
  })
  totalDebits: number;

  @ApiProperty({
    description: 'Total credits (negative amounts in absolute value) calculated with ALL entries',
  })
  totalCredits: number;

  @ApiProperty({
    description: 'Total number of entries that affect this account',
  })
  entriesCount: number;

  @ApiProperty({
    description: 'Limited list of entries for display purposes only (ordered by date DESC)',
    type: [AccountLedgerEntryHttpDto],
  })
  entries: AccountLedgerEntryHttpDto[];

  @ApiProperty({
    description: 'Indicates if there are more entries beyond the limited list',
  })
  hasMoreEntries: boolean;
}

