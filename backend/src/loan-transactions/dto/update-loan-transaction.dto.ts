import { PartialType } from '@nestjs/swagger';
import { CreateLoanTransactionDto } from './create-loan-transaction.dto';

export class UpdateLoanTransactionDto extends PartialType(
  CreateLoanTransactionDto,
) {}
