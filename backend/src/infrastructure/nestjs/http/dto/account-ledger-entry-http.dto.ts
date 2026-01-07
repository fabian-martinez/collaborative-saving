import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccountType,
  ALL_ACCOUNT_TYPES,
} from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

/**
 * HTTP Response DTO for Account Ledger Entry
 *
 * Maps application layer DTO (camelCase) to HTTP response (snake_case).
 */
export class AccountLedgerEntryHttpDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  operation_id: string;

  @ApiProperty({ enum: ALL_ACCOUNT_TYPES })
  account_type: AccountType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  loan_id: string | null;

  @ApiProperty({ nullable: true })
  stock_id: string | null;

  @ApiProperty({ nullable: true })
  mandatory_contribution_id: string | null;

  @ApiProperty({ nullable: true })
  stock_subscription_id: string | null;

  @ApiPropertyOptional({ enum: OperationType })
  operation_type?: OperationType;

  @ApiPropertyOptional()
  operation_date?: Date;
}
