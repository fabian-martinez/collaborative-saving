import { ApiProperty } from '@nestjs/swagger';

export class StockOperationResponseHttpDto {
  @ApiProperty({
    description: 'Identificador de la operación registrada',
  })
  operation_id!: string;

  @ApiProperty({
    description: 'Mensaje resumen de la acción realizada',
  })
  message!: string;

  @ApiProperty({
    description: 'Detalle adicional con información relevante de la operación',
    type: 'object',
    additionalProperties: true,
  })
  details!: Record<string, any>;
}
