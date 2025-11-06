import { ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingSummaryHttpDto {
  @ApiPropertyOptional({
    description: 'Total de efectivo en la reunión',
    example: 150000.0,
  })
  total_cash?: number;

  @ApiPropertyOptional({
    description: 'Total de intereses generados',
    example: 5000.0,
  })
  total_interest?: number;

  @ApiPropertyOptional({
    description: 'Total de préstamos realizados',
    example: 20000.0,
  })
  total_loans?: number;

  @ApiPropertyOptional({
    description: 'Total recaudado (CASH positivos - NOVELTY_LOSS)',
    example: 145000.0,
  })
  total_collected?: number;

  @ApiPropertyOptional({
    description: 'Total de dividendos pagados',
    example: 10000.0,
  })
  total_dividends?: number;

  @ApiPropertyOptional({
    description: 'Total invertido en acciones',
    example: 30000.0,
  })
  total_stock_investment?: number;

  @ApiPropertyOptional({
    description: 'Balance final de efectivo',
    example: 120000.0,
  })
  final_cash_balance?: number;

  @ApiPropertyOptional({
    description: 'Total desembolsado',
    example: 30000.0,
  })
  total_disbursed?: number;

  @ApiPropertyOptional({
    description: 'Número de participantes',
    example: 15,
  })
  participants_count?: number;

  @ApiPropertyOptional({
    description: 'Duración de la reunión',
    example: '2h 30m',
  })
  duration?: string;
}
