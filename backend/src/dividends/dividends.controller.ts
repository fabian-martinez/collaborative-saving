import { Controller, Get, Query } from '@nestjs/common';
import { PendingMemberPayment } from '../meetings/entities/pending-member-payment.entity';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DividendsService } from './dividends.service';

@ApiTags('Dividends')
@Controller('dividends')
export class DividendsController {
  constructor(private readonly dividendsService: DividendsService) {}

  @Get('pending')
  @ApiOperation({
    summary: 'Obtiene los dividendos pendientes',
    description:
      'Lista los dividendos pendientes para un socio y/o reunión. Por defecto, solo los de estado pending.',
  })
  @ApiQuery({
    name: 'memberId',
    required: false,
    description: 'Filtrar por ID de socio',
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filtrar por ID de reunión',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado (pending, paid, etc.)',
    example: 'pending',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de dividendos pendientes',
    type: [PendingMemberPayment],
  })
  async getPendingDividends(
    @Query('memberId') memberId?: string,
    @Query('meetingId') meetingId?: string,
    @Query('status') status: string = 'pending',
  ) {
    return this.dividendsService.getPendingDividends(
      memberId,
      meetingId,
      status,
    );
  }

  @Get('history')
  @ApiOperation({
    summary: 'Obtiene el historial de dividendos',
    description:
      'Lista todos los dividendos (pendientes y pagados) para un socio y/o reunión.',
  })
  @ApiQuery({
    name: 'memberId',
    required: false,
    description: 'Filtrar por ID de socio',
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filtrar por ID de reunión',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado (pending, paid, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de dividendos (histórico)',
    type: [PendingMemberPayment],
  })
  async getDividendHistory(
    @Query('memberId') memberId?: string,
    @Query('meetingId') meetingId?: string,
    @Query('status') status?: string,
  ) {
    return this.dividendsService.getDividendHistory(
      memberId,
      meetingId,
      status,
    );
  }
}
