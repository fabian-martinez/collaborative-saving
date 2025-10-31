import { ApiProperty } from '@nestjs/swagger';

export class StockHistoryPointDto {
  @ApiProperty({ description: 'Fecha de la reunión' })
  date: string;

  @ApiProperty({ description: 'ID de la reunión' })
  meetingId: string;

  @ApiProperty({ description: 'Tipo de acción' })
  stockType: string;

  @ApiProperty({ description: 'Cantidad en esa fecha' })
  quantity: number;

  @ApiProperty({ description: 'Cambio respecto al punto anterior' })
  change: number;

  @ApiProperty({ description: 'IDs de operaciones que causaron el cambio' })
  operations: string[];

  @ApiProperty({ description: 'Descripción del cambio' })
  changeDescription: string;
}

export class StockHistoryResponseDto {
  @ApiProperty({ description: 'Tipo de acción' })
  stockType: string;

  @ApiProperty({ description: 'Historial cronológico' })
  history: StockHistoryPointDto[];

  @ApiProperty({ description: 'Cantidad actual' })
  currentQuantity: number;

  @ApiProperty({ description: 'Total de operaciones' })
  totalOperations: number;

  @ApiProperty({ description: 'Cantidad inicial estimada' })
  initialQuantity: number;
}

export class StockHistoryRequestDto {
  @ApiProperty({ description: 'Tipo de acción específico (opcional)' })
  stockType?: string;

  @ApiProperty({
    description: 'Incluir operaciones de transferencia',
    default: true,
  })
  includeTransfers?: boolean;

  @ApiProperty({
    description: 'Incluir operaciones de pago con acciones',
    default: true,
  })
  includeLoanPayments?: boolean;
}
