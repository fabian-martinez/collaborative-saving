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
import { DeleteInterestDistributionConfigUseCase } from '@application/use-cases/settings/delete-interest-distribution-config.use-case';

@ApiTags('Settings V2')
@Controller('v2/settings')
export class SettingsV2Controller {
  constructor(
    private readonly getLoanTypesQuery: GetLoanTypesQueryHandler,
    private readonly getStockTypesQuery: GetStockTypesQueryHandler,
    private readonly getInterestDistributionConfigsQuery: GetInterestDistributionConfigsQueryHandler,
    private readonly createInterestDistributionConfigUseCase: CreateInterestDistributionConfigUseCase,
    private readonly deleteInterestDistributionConfigUseCase: DeleteInterestDistributionConfigUseCase,
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

  @Delete('distribution-configs/:id')
  @ApiOperation({ summary: 'Delete a distribution config', description: 'Removes a mapping by its ID.' })
  @ApiResponse({ status: 204, description: 'Config deleted successfully' })
  async deleteConfig(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteInterestDistributionConfigUseCase.execute(id);
  }
}
