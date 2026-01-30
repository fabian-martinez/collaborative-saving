import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoanTypeResponseHttpDto } from '../dto/loan-type-response-http.dto';
import { StockTypeResponseHttpDto } from '../dto/stock-type-response-http.dto';
import { InterestDistributionConfigResponseHttpDto } from '../dto/interest-distribution-config-response-http.dto';
import { CreateInterestDistributionConfigHttpDto } from '../dto/create-interest-distribution-config-http.dto';
import { GetLoanTypesQueryHandler } from '@application/queries/settings/get-loan-types.query-handler';
import { GetStockTypesQueryHandler } from '@application/queries/settings/get-stock-types.query-handler';
import { GetInterestDistributionConfigsQueryHandler } from '@application/queries/settings/get-interest-distribution-configs.query-handler';
import { CreateInterestDistributionConfigUseCase } from '@application/use-cases/settings/create-interest-distribution-config.use-case';
import { UpdateInterestDistributionConfigUseCase } from '@application/use-cases/settings/update-interest-distribution-config.use-case';
import { DeleteInterestDistributionConfigUseCase } from '@application/use-cases/settings/delete-interest-distribution-config.use-case';
import { CreateLoanTypeUseCase } from '@application/use-cases/settings/create-loan-type.use-case';
import { UpdateLoanTypeUseCase } from '@application/use-cases/settings/update-loan-type.use-case';
import { DeleteLoanTypeUseCase } from '@application/use-cases/settings/delete-loan-type.use-case';
import { CreateStockTypeUseCase } from '@application/use-cases/settings/create-stock-type.use-case';
import { UpdateStockTypeUseCase } from '@application/use-cases/settings/update-stock-type.use-case';
import { DeleteStockTypeUseCase } from '@application/use-cases/settings/delete-stock-type.use-case';
import { CreateLoanTypeHttpDto } from '../dto/create-loan-type-http.dto';
import { UpdateLoanTypeHttpDto } from '../dto/update-loan-type-http.dto';
import { CreateStockTypeHttpDto } from '../dto/create-stock-type-http.dto';
import { UpdateStockTypeHttpDto } from '../dto/update-stock-type-http.dto';
import { UpdateInterestDistributionConfigHttpDto } from '../dto/update-interest-distribution-config-http.dto';
import { Patch, Put } from '@nestjs/common';

@ApiTags('Settings V2')
@Controller('v2/settings')
export class SettingsV2Controller {
  constructor(
    private readonly getLoanTypesQuery: GetLoanTypesQueryHandler,
    private readonly getStockTypesQuery: GetStockTypesQueryHandler,
    private readonly getInterestDistributionConfigsQuery: GetInterestDistributionConfigsQueryHandler,
    private readonly createInterestDistributionConfigUseCase: CreateInterestDistributionConfigUseCase,
    private readonly updateInterestDistributionConfigUseCase: UpdateInterestDistributionConfigUseCase,
    private readonly deleteInterestDistributionConfigUseCase: DeleteInterestDistributionConfigUseCase,
    private readonly createLoanTypeUseCase: CreateLoanTypeUseCase,
    private readonly updateLoanTypeUseCase: UpdateLoanTypeUseCase,
    private readonly deleteLoanTypeUseCase: DeleteLoanTypeUseCase,
    private readonly createStockTypeUseCase: CreateStockTypeUseCase,
    private readonly updateStockTypeUseCase: UpdateStockTypeUseCase,
    private readonly deleteStockTypeUseCase: DeleteStockTypeUseCase,
  ) {}

  @Get('loan-types')
  @ApiOperation({ summary: 'Get all loan types', description: 'Returns a list of all available loan types with their default settings.' })
  @ApiResponse({ status: 200, type: [LoanTypeResponseHttpDto], description: 'List of loan types retrieved successfully' })
  async getLoanTypes(): Promise<LoanTypeResponseHttpDto[]> {
    const types = await this.getLoanTypesQuery.execute();
    return types.map((t) => ({
      id: t.id,
      name: t.name,
      default_approved_amount: t.defaultApprovedAmount,
      default_interest_rate: t.defaultInterestRate,
      default_term: t.defaultTerm,
      amortization_type: t.amortizationType,
    }));
  }

  @Post('loan-types')
  @ApiOperation({ summary: 'Create a loan type' })
  @ApiResponse({ status: 201, type: LoanTypeResponseHttpDto })
  async createLoanType(@Body() dto: CreateLoanTypeHttpDto): Promise<LoanTypeResponseHttpDto> {
    const saved = await this.createLoanTypeUseCase.execute({
      name: dto.name,
      defaultApprovedAmount: dto.default_approved_amount,
      defaultInterestRate: dto.default_interest_rate,
      defaultTerm: dto.default_term,
      amortizationType: dto.amortization_type,
    });
    return {
      id: saved.id,
      name: saved.name,
      default_approved_amount: saved.defaultApprovedAmount,
      default_interest_rate: saved.defaultInterestRate,
      default_term: saved.defaultTerm,
      amortization_type: saved.amortizationType,
    };
  }

  @Patch('loan-types/:id')
  @ApiOperation({ summary: 'Update a loan type' })
  @ApiResponse({ status: 200, type: LoanTypeResponseHttpDto })
  async updateLoanType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanTypeHttpDto,
  ): Promise<LoanTypeResponseHttpDto> {
    const saved = await this.updateLoanTypeUseCase.execute({
      id,
      name: dto.name,
      defaultApprovedAmount: dto.default_approved_amount,
      defaultInterestRate: dto.default_interest_rate,
      defaultTerm: dto.default_term,
      amortizationType: dto.amortization_type,
    });
    return {
      id: saved.id,
      name: saved.name,
      default_approved_amount: saved.defaultApprovedAmount,
      default_interest_rate: saved.defaultInterestRate,
      default_term: saved.defaultTerm,
      amortization_type: saved.amortizationType,
    };
  }

  @Delete('loan-types/:id')
  @ApiOperation({ summary: 'Delete a loan type' })
  @ApiResponse({ status: 204 })
  async deleteLoanType(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteLoanTypeUseCase.execute(id);
  }

  @Get('stock-types')
  @ApiOperation({ summary: 'Get all stock types', description: 'Returns a list of all available stock types and their behaviors.' })
  @ApiResponse({ status: 200, type: [StockTypeResponseHttpDto], description: 'List of stock types retrieved successfully' })
  async getStockTypes(): Promise<StockTypeResponseHttpDto[]> {
    const types = await this.getStockTypesQuery.execute();
    return types.map((t) => ({
      id: t.id,
      name: t.name,
      behavior: t.behavior,
    }));
  }

  @Post('stock-types')
  @ApiOperation({ summary: 'Create a stock type' })
  @ApiResponse({ status: 201, type: StockTypeResponseHttpDto })
  async createStockType(@Body() dto: CreateStockTypeHttpDto): Promise<StockTypeResponseHttpDto> {
    const saved = await this.createStockTypeUseCase.execute({
      name: dto.name,
      behavior: dto.behavior,
    });
    return {
      id: saved.id,
      name: saved.name,
      behavior: saved.behavior,
    };
  }

  @Patch('stock-types/:id')
  @ApiOperation({ summary: 'Update a stock type' })
  @ApiResponse({ status: 200, type: StockTypeResponseHttpDto })
  async updateStockType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockTypeHttpDto,
  ): Promise<StockTypeResponseHttpDto> {
    const saved = await this.updateStockTypeUseCase.execute({
      id,
      name: dto.name,
      behavior: dto.behavior,
    });
    return {
      id: saved.id,
      name: saved.name,
      behavior: saved.behavior,
    };
  }

  @Delete('stock-types/:id')
  @ApiOperation({ summary: 'Delete a stock type' })
  @ApiResponse({ status: 204 })
  async deleteStockType(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteStockTypeUseCase.execute(id);
  }

  @Get('distribution-configs')
  @ApiOperation({ summary: 'Get all interest distribution configs', description: 'Returns all mappings between loan types and stock types for interest distribution.' })
  @ApiResponse({ status: 200, type: [InterestDistributionConfigResponseHttpDto], description: 'List of configs retrieved successfully' })
  async getDistributionConfigs(): Promise<InterestDistributionConfigResponseHttpDto[]> {
    const configs = await this.getInterestDistributionConfigsQuery.execute();
    return configs.map((c) => ({
      id: c.id,
      loan_type_id: c.loanTypeId,
      stock_type_id: c.stockTypeId,
    }));
  }

  @Post('distribution-configs')
  @ApiOperation({ summary: 'Create a distribution config', description: 'Mapps a loan type to a stock type for interest distribution.' })
  @ApiResponse({ status: 201, type: InterestDistributionConfigResponseHttpDto, description: 'Config created successfully' })
  async createConfig(
    @Body() dto: CreateInterestDistributionConfigHttpDto,
  ): Promise<InterestDistributionConfigResponseHttpDto> {
    const saved = await this.createInterestDistributionConfigUseCase.execute({
      loanTypeId: dto.loan_type_id,
      stockTypeId: dto.stock_type_id,
    });
    return {
      id: saved.id,
      loan_type_id: saved.loanTypeId,
      stock_type_id: saved.stockTypeId,
    };
  }

  @Patch('distribution-configs/:id')
  @ApiOperation({ summary: 'Update a distribution config' })
  @ApiResponse({ status: 200, type: InterestDistributionConfigResponseHttpDto })
  async updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterestDistributionConfigHttpDto,
  ): Promise<InterestDistributionConfigResponseHttpDto> {
    const saved = await this.updateInterestDistributionConfigUseCase.execute({
      id,
      loanTypeId: dto.loan_type_id,
      stockTypeId: dto.stock_type_id,
    });
    return {
      id: saved.id,
      loan_type_id: saved.loanTypeId,
      stock_type_id: saved.stockTypeId,
    };
  }

  @Delete('distribution-configs/:id')
  @ApiOperation({ summary: 'Delete a distribution config', description: 'Removes a mapping by its ID.' })
  @ApiResponse({ status: 204, description: 'Config deleted successfully' })
  async deleteConfig(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteInterestDistributionConfigUseCase.execute(id);
  }
}
