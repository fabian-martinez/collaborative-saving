/**
 * Swagger schemas para el módulo de asientos contables
 * Estos schemas se pueden agregar al archivo swagger.json principal
 */

export const LedgerEntriesSwaggerSchemas = {
  FindLedgerEntriesDto: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'Búsqueda por texto en descripción o ID de operación',
        example: 'loan payment',
      },
      memberId: {
        type: 'string',
        format: 'uuid',
        description: 'Filtrar por ID de miembro',
      },
      accountType: {
        type: 'string',
        description: 'Filtrar por tipo de cuenta',
        example: 'CASH',
      },
      meetingId: {
        type: 'string',
        format: 'uuid',
        description: 'Filtrar por ID de reunión',
      },
      dateFrom: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha desde (ISO 8601)',
        example: '2025-01-01T00:00:00Z',
      },
      dateTo: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha hasta (ISO 8601)',
        example: '2025-12-31T23:59:59Z',
      },
      page: {
        type: 'number',
        description: 'Página (por defecto 1)',
        example: 1,
        minimum: 1,
      },
      limit: {
        type: 'number',
        description: 'Resultados por página (por defecto 20, máximo 100)',
        example: 20,
        minimum: 1,
        maximum: 100,
      },
    },
  },
  LedgerEntryEnrichedDto: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID único del asiento contable',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      },
      operationId: {
        type: 'string',
        description: 'ID de la operación asociada',
        example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      },
      accountType: {
        type: 'string',
        description: 'Tipo de cuenta afectada',
        example: 'CASH',
      },
      amount: {
        type: 'number',
        description: 'Monto del asiento (positivo para débitos, negativo para créditos)',
        example: 150000.00,
      },
      description: {
        type: 'string',
        description: 'Descripción del asiento',
        example: 'Pago de cuota de préstamo',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación del asiento',
        example: '2025-01-15T10:30:00Z',
      },
      operationType: {
        type: 'string',
        description: 'Tipo de operación',
        example: 'LOAN_PAYMENT',
      },
      operationDescription: {
        type: 'string',
        description: 'Descripción de la operación',
        example: 'Pago mensual de préstamo (capital + intereses)',
      },
      operationDate: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de la operación',
        example: '2025-01-15T10:30:00Z',
      },
      memberId: {
        type: 'string',
        description: 'ID del miembro',
        example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      },
      memberName: {
        type: 'string',
        description: 'Nombre del miembro',
        example: 'Ana Gómez',
      },
      meetingId: {
        type: 'string',
        description: 'ID de la reunión',
        example: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      },
      meetingDate: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de la reunión',
        example: '2025-01-15T09:00:00Z',
      },
      loanId: {
        type: 'string',
        description: 'ID del préstamo relacionado (si aplica)',
        example: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
      },
      stockId: {
        type: 'string',
        description: 'ID de la acción relacionada (si aplica)',
        example: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
      },
      mandatoryContributionId: {
        type: 'string',
        description: 'ID de la contribución obligatoria relacionada (si aplica)',
        example: 'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
      },
      stockSubscriptionId: {
        type: 'string',
        description: 'ID de la suscripción de acción relacionada (si aplica)',
        example: 'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
      },
    },
    required: [
      'id',
      'operationId',
      'accountType',
      'amount',
      'description',
      'createdAt',
      'operationType',
      'operationDescription',
      'operationDate',
      'memberId',
      'memberName',
      'meetingId',
      'meetingDate',
    ],
  },
  LedgerEntriesResponseDto: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/LedgerEntryEnrichedDto' },
      },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      total: { type: 'number', example: 150 },
    },
    required: ['data', 'page', 'limit', 'total'],
  },
  AccountTypeOptionDto: {
    type: 'object',
    properties: {
      value: { type: 'string', example: 'CASH' },
      label: { type: 'string', example: 'Cash' },
    },
    required: ['value', 'label'],
  },
};
