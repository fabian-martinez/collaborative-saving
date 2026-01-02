import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, ALL_ACCOUNT_TYPES } from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

export class AccountLedgerEntryHttpDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  operationId: string;

  @ApiProperty({ enum: ALL_ACCOUNT_TYPES })
  accountType: AccountType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  loanId: string | null;

  @ApiProperty({ nullable: true })
  stockId: string | null;

  @ApiProperty({ nullable: true })
  mandatoryContributionId: string | null;

  @ApiProperty({ nullable: true })
  stockSubscriptionId: string | null;

  @ApiPropertyOptional({ enum: OperationType })
  operationType?: OperationType;

  @ApiPropertyOptional()
  operationDate?: Date;
}

