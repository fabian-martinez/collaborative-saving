import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { GetPortfolioStatusQueryHandler } from '@application/queries/dashboard/get-portfolio-status.query-handler';
import { GetMonthlyMovementsResponseHttpDto } from '../dto/dashboard/monthly-movements-response-http.dto';
import { GetPortfolioStatusResponseHttpDto } from '../dto/dashboard/portfolio-status-response-http.dto';

@ApiTags('Dashboard V2')
@Controller('v2/dashboard')
export class DashboardV2Controller {
  constructor(
    private readonly getMonthlyMovementsQuery: GetMonthlyMovementsQueryHandler,
    private readonly getPortfolioStatusQuery: GetPortfolioStatusQueryHandler,
  ) {}

  @Get('monthly-movements')
  @ApiOperation({
    summary: 'Get monthly movements for dashboard chart',
    description:
      'Retrieves the last 6 closed meetings and their total collected vs disbursed amounts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly movements retrieved successfully',
    type: GetMonthlyMovementsResponseHttpDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMonthlyMovements(): Promise<GetMonthlyMovementsResponseHttpDto> {
    const result = await this.getMonthlyMovementsQuery.execute();

    return {
      movements: result.movements,
      labels: result.movements.map((m) => m.label),
      collected: result.movements.map((m) => m.collected),
      disbursed: result.movements.map((m) => m.disbursed),
    };
  }

  @Get('portfolio-status')
  @ApiOperation({
    summary: 'Get portfolio status distribution',
    description: 'Returns count of loans up to date, overdue and written off.',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio status retrieved successfully',
    type: GetPortfolioStatusResponseHttpDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPortfolioStatus(): Promise<GetPortfolioStatusResponseHttpDto> {
    const result = await this.getPortfolioStatusQuery.execute();

    return {
      up_to_date: result.upToDate,
      overdue: result.overdue,
      written_off: result.writtenOff,
    };
  }
}
