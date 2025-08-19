import { ApiProperty } from '@nestjs/swagger';

export class LedgerEntryEnrichedDto {
  @ApiProperty({
    description: 'ID único del asiento contable',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'ID de la operación asociada',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  operationId: string;

  @ApiProperty({
    description: 'Tipo de cuenta afectada',
    example: 'CASH',
  })
  accountType: string;

  @ApiProperty({
    description:
      'Monto del asiento (positivo para débitos, negativo para créditos)',
    example: 150000.0,
  })
  amount: number;

  @ApiProperty({
    description: 'Descripción del asiento',
    example: 'Pago de cuota de préstamo',
  })
  description: string;

  @ApiProperty({
    description: 'Fecha de creación del asiento',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  // Campos enriquecidos de la operación
  @ApiProperty({
    description: 'Tipo de operación',
    example: 'LOAN_PAYMENT',
  })
  operationType: string;

  @ApiProperty({
    description: 'Descripción de la operación',
    example: 'Pago mensual de préstamo (capital + intereses)',
  })
  operationDescription: string;

  @ApiProperty({
    description: 'Fecha de la operación',
    example: '2025-01-15T10:30:00Z',
  })
  operationDate: Date;

  // Campos enriquecidos del miembro
  @ApiProperty({
    description: 'ID del miembro',
    example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  })
  memberId: string;

  @ApiProperty({
    description: 'Nombre del miembro',
    example: 'Ana Gómez',
  })
  memberName: string;

  // Campos enriquecidos de la reunión
  @ApiProperty({
    description: 'ID de la reunión',
    example: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  })
  meetingId: string;

  @ApiProperty({
    description: 'Fecha de la reunión',
    example: '2025-01-15T09:00:00Z',
  })
  meetingDate: Date;

  // Campos opcionales para entidades relacionadas
  @ApiProperty({
    description: 'ID del préstamo relacionado (si aplica)',
    example: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    required: false,
  })
  loanId?: string;

  @ApiProperty({
    description: 'ID de la acción relacionada (si aplica)',
    example: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    required: false,
  })
  stockId?: string;

  @ApiProperty({
    description: 'ID de la contribución obligatoria relacionada (si aplica)',
    example: 'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    required: false,
  })
  mandatoryContributionId?: string;

  @ApiProperty({
    description: 'ID de la suscripción de acción relacionada (si aplica)',
    example: 'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    required: false,
  })
  stockSubscriptionId?: string;
}
