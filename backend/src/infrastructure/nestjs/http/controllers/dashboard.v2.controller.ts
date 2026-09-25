import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { GetPortfolioStatusQueryHandler } from '@application/queries/dashboard/get-portfolio-status.query-handler';
import { GetDashboardMetricsQueryHandler } from '@application/queries/dashboard/get-dashboard-metrics.query-handler';
import { GetMonthlyMovementsResponseHttpDto } from '../dto/dashboard/monthly-movements-response-http.dto';
import { GetPortfolioStatusResponseHttpDto } from '../dto/dashboard/portfolio-status-response-http.dto';
import { GetDashboardMetricsResponseHttpDto } from '../dto/dashboard/get-dashboard-metrics-response-http.dto';
import { DashboardSessionResponseHttpDto } from '../dto/dashboard/dashboard-session-response-http.dto';

@ApiTags('Dashboard V2')
@Controller('v2/dashboard')
export class DashboardV2Controller {
  constructor(
    private readonly getMonthlyMovementsQuery: GetMonthlyMovementsQueryHandler,
    private readonly getPortfolioStatusQuery: GetPortfolioStatusQueryHandler,
    private readonly getDashboardMetricsQuery: GetDashboardMetricsQueryHandler,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Dashboard health check and session validation',
    description:
      'Validates that the authenticated member has an active session and access to the dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard session is valid',
    type: DashboardSessionResponseHttpDto,
  })
  getDashboardSession(): DashboardSessionResponseHttpDto {
    return { status: 'ok' };
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get dashboard summary metrics',
    description:
      'Retrieves metrics for active members, total stocks, active loans, portfolio totals, overdue amounts, and monthly collection.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    type: GetDashboardMetricsResponseHttpDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDashboardMetrics(): Promise<GetDashboardMetricsResponseHttpDto> {
    const result = await this.getDashboardMetricsQuery.execute();

    return {
      active_members: {
        count: result.activeMembers.count,
        total: result.activeMembers.total,
        change_percent: result.activeMembers.changePercent,
      },
      total_stocks: {
        count: result.totalStocks.count,
        value: result.totalStocks.value,
        change_percent: result.totalStocks.changePercent,
      },
      active_loans: {
        count: result.activeLoans.count,
        in_portfolio: result.activeLoans.inPortfolio,
      },
      total_portfolio: {
        value: result.totalPortfolio.value,
      },
      overdue_portfolio: {
        value: result.overduePortfolio.value,
        percent_of_total: result.overduePortfolio.percentOfTotal,
      },
      monthly_collected: {
        value: result.monthlyCollected.value,
        change_percent: result.monthlyCollected.changePercent,
      },
    };
  }

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
