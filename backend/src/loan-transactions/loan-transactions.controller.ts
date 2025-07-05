import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LoanTransactionsService } from './loan-transactions.service';
import { CreateLoanTransactionDto } from './dto/create-loan-transaction.dto';
import { UpdateLoanTransactionDto } from './dto/update-loan-transaction.dto';
import { Operation } from '../operations/entities/operation.entity';

@ApiTags('loan-transactions')
@Controller('loan-transactions')
export class LoanTransactionsController {
  constructor(
    private readonly loanTransactionsService: LoanTransactionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a loan transaction' })
  @ApiResponse({
    status: 201,
    description: 'The loan transaction has been successfully created.',
    type: Operation,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createLoanTransactionDto: CreateLoanTransactionDto) {
    return this.loanTransactionsService.create(createLoanTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loan transactions' })
  @ApiResponse({
    status: 200,
    description: 'A list of all loan transactions (operations).',
    type: [Operation],
  })
  findAll() {
    return this.loanTransactionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan transaction by id' })
  @ApiParam({ name: 'id', description: 'The ID of the operation' })
  @ApiResponse({
    status: 200,
    description: 'The loan transaction (operation).',
    type: Operation,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  findOne(@Param('id') id: string) {
    return this.loanTransactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a loan transaction' })
  @ApiParam({ name: 'id', description: 'The ID of the operation to update' })
  @ApiResponse({
    status: 200,
    description: 'The transaction has been successfully updated.',
    type: Operation,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  update(
    @Param('id') id: string,
    @Body() updateLoanTransactionDto: UpdateLoanTransactionDto,
  ) {
    return this.loanTransactionsService.update(id, updateLoanTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a loan transaction' })
  @ApiParam({ name: 'id', description: 'The ID of the operation to delete' })
  @ApiResponse({
    status: 200,
    description: 'The transaction has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  remove(@Param('id') id: string) {
    return this.loanTransactionsService.remove(id);
  }
}
