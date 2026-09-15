/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MemberRole } from '@domain/enums/member-role.enum';
import { CreateLoanTypeUseCase } from '@application/use-cases/settings/create-loan-type.use-case';
import { UpdateLoanTypeUseCase } from '@application/use-cases/settings/update-loan-type.use-case';
import { DeleteLoanTypeUseCase } from '@application/use-cases/settings/delete-loan-type.use-case';
import { GetLoanTypesQueryHandler } from '@application/queries/settings/get-loan-types.query-handler';
import { GetLoanTypeDetailQueryHandler } from '@application/queries/settings/get-loan-type-detail.query-handler';
import { CreateLoanTypeHttpDto } from '../dto/create-loan-type-http.dto';
import { UpdateLoanTypeHttpDto } from '../dto/update-loan-type-http.dto';
import { LoanTypeResponseHttpDto } from '../dto/loan-type-response-http.dto';
import { LoanTypeResponseDto } from '@application/dto/settings/loan-type-response.dto';
import { LoanTypeNotFoundException } from '@application/exceptions/loan-type-not-found.exception';

@ApiTags('Loan Types V2')
@Controller('v2/loan-types')
export class LoanTypesV2Controller {
  constructor(
    private readonly getLoanTypesQuery: GetLoanTypesQueryHandler,
    private readonly getLoanTypeDetailQuery: GetLoanTypeDetailQueryHandler,
    private readonly createLoanTypeUseCase: CreateLoanTypeUseCase,
    private readonly updateLoanTypeUseCase: UpdateLoanTypeUseCase,
    private readonly deleteLoanTypeUseCase: DeleteLoanTypeUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all loan types',
    description: 'Returns all active loan types in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of loan types retrieved successfully',
    type: [LoanTypeResponseHttpDto],
  })
  async list(): Promise<LoanTypeResponseHttpDto[]> {
    const loanTypes = await this.getLoanTypesQuery.execute();
    return loanTypes.map((lt) => this.toHttpDto(lt));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get loan type by ID',
    description: 'Returns details of a specific loan type',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the loan type',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan type details retrieved successfully',
    type: LoanTypeResponseHttpDto,
  })
  @ApiNotFoundResponse({ description: 'Loan type not found' })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanTypeResponseHttpDto> {
    try {
      const result = await this.getLoanTypeDetailQuery.execute(id);
      return this.toHttpDto(result);
    } catch (error) {
      if (error instanceof LoanTypeNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post()
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new loan type',
    description: 'Creates a new loan type. Restricted to ADMIN users.',
  })
  @ApiBody({ type: CreateLoanTypeHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Loan type created successfully',
    type: LoanTypeResponseHttpDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data or duplicate code' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Body() dto: CreateLoanTypeHttpDto,
  ): Promise<LoanTypeResponseHttpDto> {
    try {
      const result = await this.createLoanTypeUseCase.execute({
        name: dto.name,
        code: dto.code,
        interestRate: dto.interest_rate,
        description: dto.description,
      });
      return this.toHttpDto(result);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Patch(':id')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Update a loan type',
    description: 'Updates an existing loan type. Restricted to ADMIN users.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the loan type to update',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  @ApiBody({ type: UpdateLoanTypeHttpDto })
  @ApiResponse({
    status: 200,
    description: 'Loan type updated successfully',
    type: LoanTypeResponseHttpDto,
  })
  @ApiNotFoundResponse({ description: 'Loan type not found' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanTypeHttpDto,
  ): Promise<LoanTypeResponseHttpDto> {
    try {
      const result = await this.updateLoanTypeUseCase.execute(id, {
        name: dto.name,
        interestRate: dto.interest_rate,
        description: dto.description,
      });
      return this.toHttpDto(result);
    } catch (error) {
      if (error instanceof LoanTypeNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a loan type',
    description:
      'Soft deletes a loan type. Restricted to ADMIN users. Will fail if there are active loans associated.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the loan type to delete',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  @ApiResponse({
    status: 204,
    description: 'Loan type deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Loan type not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete loan type with active loans associated',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.deleteLoanTypeUseCase.execute(id);
    } catch (error) {
      if (error instanceof LoanTypeNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private toHttpDto(dto: LoanTypeResponseDto): LoanTypeResponseHttpDto {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      interest_rate: dto.interestRate,
      description: dto.description,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt,
    };
  }
}
