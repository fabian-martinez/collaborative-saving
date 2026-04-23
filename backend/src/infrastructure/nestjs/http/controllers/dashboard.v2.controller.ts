import { Controller, Get, UsePipes, ValidationPipe, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { GetMonthlyMovementsResponseHttpDto } from '../dto/dashboard/monthly-movements-response-http.dto';

@ApiTags('Dashboard V2')
@Controller('v2/dashboard')
export class DashboardV2Controller {
  constructor(
    private readonly getMonthlyMovementsQuery: GetMonthlyMovementsQueryHandler,
  ) {}

  @Get('monthly-movements')
  @ApiOperation({
    summary: 'Get monthly movements for dashboard chart',
    description: 'Retrieves the last 6 closed meetings and their total collected vs disbursed amounts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly movements retrieved successfully',
    type: GetMonthlyMovementsResponseHttpDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMonthlyMovements(): Promise<GetMonthlyMovementsResponseHttpDto> {
    try {
      const result = await this.getMonthlyMovementsQuery.execute();

      return {
        movements: result.movements,
        labels: result.movements.map(m => m.label),
        collected: result.movements.map(m => m.collected),
        disbursed: result.movements.map(m => m.disbursed),
      };
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
