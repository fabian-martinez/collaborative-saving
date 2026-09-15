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
import { CreateStockTypeUseCase } from '@application/use-cases/settings/create-stock-type.use-case';
import { UpdateStockTypeUseCase } from '@application/use-cases/settings/update-stock-type.use-case';
import { DeleteStockTypeUseCase } from '@application/use-cases/settings/delete-stock-type.use-case';
import { GetStockTypesQueryHandler } from '@application/queries/settings/get-stock-types.query-handler';
import { GetStockTypeDetailQueryHandler } from '@application/queries/settings/get-stock-type-detail.query-handler';
import { CreateStockTypeHttpDto } from '../dto/create-stock-type-http.dto';
import { UpdateStockTypeHttpDto } from '../dto/update-stock-type-http.dto';
import { StockTypeResponseHttpDto } from '../dto/stock-type-response-http.dto';
import { StockTypeResponseDto } from '@application/dto/settings/stock-type-response.dto';
import { StockTypeNotFoundException } from '@application/exceptions/stock-type-not-found.exception';

@ApiTags('Stock Types V2')
@Controller('v2/stock-types')
export class StockTypesV2Controller {
  constructor(
    private readonly getStockTypesQuery: GetStockTypesQueryHandler,
    private readonly getStockTypeDetailQuery: GetStockTypeDetailQueryHandler,
    private readonly createStockTypeUseCase: CreateStockTypeUseCase,
    private readonly updateStockTypeUseCase: UpdateStockTypeUseCase,
    private readonly deleteStockTypeUseCase: DeleteStockTypeUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all stock types',
    description: 'Returns all active stock types in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of stock types retrieved successfully',
    type: [StockTypeResponseHttpDto],
  })
  async list(): Promise<StockTypeResponseHttpDto[]> {
    const stockTypes = await this.getStockTypesQuery.execute();
    return stockTypes.map((st) => this.toHttpDto(st));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get stock type by ID',
    description: 'Returns details of a specific stock type',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the stock type',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock type details retrieved successfully',
    type: StockTypeResponseHttpDto,
  })
  @ApiNotFoundResponse({ description: 'Stock type not found' })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StockTypeResponseHttpDto> {
    try {
      const result = await this.getStockTypeDetailQuery.execute(id);
      return this.toHttpDto(result);
    } catch (error) {
      if (error instanceof StockTypeNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post()
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new stock type',
    description: 'Creates a new stock type. Restricted to ADMIN users.',
  })
  @ApiBody({ type: CreateStockTypeHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Stock type created successfully',
    type: StockTypeResponseHttpDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data or duplicate code' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Body() dto: CreateStockTypeHttpDto,
  ): Promise<StockTypeResponseHttpDto> {
    try {
      const result = await this.createStockTypeUseCase.execute({
        name: dto.name,
        code: dto.code,
        behavior: dto.behavior,
        isGuaranteed: dto.is_guaranteed,
        guaranteedYield: dto.guaranteed_yield,
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
    summary: 'Update a stock type',
    description: 'Updates an existing stock type. Restricted to ADMIN users.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the stock type to update',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  @ApiBody({ type: UpdateStockTypeHttpDto })
  @ApiResponse({
    status: 200,
    description: 'Stock type updated successfully',
    type: StockTypeResponseHttpDto,
  })
  @ApiNotFoundResponse({ description: 'Stock type not found' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockTypeHttpDto,
  ): Promise<StockTypeResponseHttpDto> {
    try {
      const result = await this.updateStockTypeUseCase.execute(id, {
        name: dto.name,
        behavior: dto.behavior,
        isGuaranteed: dto.is_guaranteed,
        guaranteedYield: dto.guaranteed_yield,
        description: dto.description,
      });
      return this.toHttpDto(result);
    } catch (error) {
      if (error instanceof StockTypeNotFoundException) {
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
    summary: 'Delete a stock type',
    description:
      'Soft deletes a stock type. Restricted to ADMIN users. Will fail if there are active stocks associated.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the stock type to delete',
    example: '681c73c5-0f84-449e-9571-a685462e256f',
  })
  @ApiResponse({
    status: 204,
    description: 'Stock type deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Stock type not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete stock type with active stocks associated',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.deleteStockTypeUseCase.execute(id);
    } catch (error) {
      if (error instanceof StockTypeNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private toHttpDto(dto: StockTypeResponseDto): StockTypeResponseHttpDto {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      behavior: dto.behavior,
      is_guaranteed: dto.isGuaranteed,
      guaranteed_yield: dto.guaranteedYield,
      description: dto.description,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt,
    };
  }
}
