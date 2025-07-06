import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Loan } from './entities/loan.entity';

@ApiTags('loans')
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new loan' })
  @ApiResponse({
    status: 201,
    description: 'The loan has been successfully created.',
    type: Loan,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loans' })
  @ApiResponse({
    status: 200,
    description: 'Return all loans.',
    type: [Loan],
  })
  findAll() {
    return this.loansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a loan by id' })
  @ApiParam({ name: 'id', description: 'The ID of the loan' })
  @ApiResponse({ status: 200, description: 'Return the loan.', type: Loan })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a loan' })
  @ApiParam({ name: 'id', description: 'The ID of the loan to update' })
  @ApiResponse({
    status: 200,
    description: 'The loan has been successfully updated.',
    type: Loan,
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto) {
    return this.loansService.update(id, updateLoanDto);
  }
}
