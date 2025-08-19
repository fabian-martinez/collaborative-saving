import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LedgerEntriesService } from './ledger-entries.service';
import { FindLedgerEntriesDto } from './dto/find-ledger-entries.dto';
import { LedgerEntryEnrichedDto } from './dto/ledger-entry-enriched.dto';

@ApiTags('ledger-entries')
@Controller('ledger-entries')
export class LedgerEntriesController {
  constructor(private readonly ledgerEntriesService: LedgerEntriesService) {}

  @Get('account-types')
  @ApiOperation({
    summary: 'Obtener tipos de cuenta disponibles',
    description:
      'Retorna la lista de todos los tipos de cuenta disponibles para filtrar asientos contables.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de cuenta con sus etiquetas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string', example: 'CASH' },
          label: { type: 'string', example: 'Cash' },
        },
      },
    },
  })
  getAccountTypes() {
    return [
      { value: 'CASH', label: 'Cash' },
      { value: 'CASH_ACCOUNT', label: 'Cash Account' },
      { value: 'LOANS_RECEIVABLE', label: 'Loans Receivable' },
      { value: 'INVESTMENT_IN_STOCKS', label: 'Investment in Stocks' },
      { value: 'DIVIDENDS_PAYABLE', label: 'Dividends Payable' },
      { value: 'STOCK_CAPITAL', label: 'Stock Capital' },
      { value: 'REVALUATION_SURPLUS', label: 'Revaluation Surplus' },
      { value: 'MEMBER_EQUITY', label: 'Member Equity' },
      { value: 'INTEREST_INCOME', label: 'Interest Income' },
      { value: 'FEE_INCOME', label: 'Fee Income' },
      {
        value: 'MANDATORY_CONTRIBUTION_INCOME',
        label: 'Mandatory Contribution Income',
      },
      { value: 'INSURANCE_INCOME', label: 'Insurance Income' },
      { value: 'DIVIDEND_EXPENSE_ACCOUNT', label: 'Dividend Expense' },
      { value: 'OTHER_EXPENSES_ACCOUNT', label: 'Other Expenses' },
      { value: 'NOVELTY_LOSS', label: 'Novelty Loss' },
    ];
  }

  @Get()
  @ApiOperation({
    summary: 'Listar asientos contables con filtros y paginación',
    description:
      'Obtiene una lista paginada de asientos contables con opciones de filtrado por texto, miembro, tipo de cuenta, reunión y rango de fechas. Los datos incluyen información enriquecida de operaciones, miembros y reuniones.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de asientos contables enriquecidos',
    schema: {
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
    },
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Búsqueda por texto en descripción o ID de operación',
    example: 'loan payment',
  })
  @ApiQuery({
    name: 'memberId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filtrar por ID de miembro',
  })
  @ApiQuery({
    name: 'accountType',
    required: false,
    type: String,
    description: 'Filtrar por tipo de cuenta',
    example: 'CASH',
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filtrar por ID de reunión',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Fecha desde (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Fecha hasta (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (por defecto 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Resultados por página (por defecto 20, máximo 100)',
    example: 20,
  })
  async findAll(@Query() query: FindLedgerEntriesDto) {
    return this.ledgerEntriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un asiento contable por su ID',
    description:
      'Obtiene un asiento contable específico con información enriquecida de su operación, miembro y reunión asociados.',
  })
  @ApiParam({
    name: 'id',
    description: 'El ID del asiento contable',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'El asiento contable con información enriquecida',
    type: LedgerEntryEnrichedDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asiento contable no encontrado.',
  })
  async findOne(@Param('id') id: string) {
    return this.ledgerEntriesService.findOne(id);
  }

  @Get('operation/:operationId')
  @ApiOperation({
    summary: 'Obtener asientos contables de una operación específica',
    description:
      'Obtiene todos los asientos contables asociados a una operación específica, ordenados por fecha de creación. Útil para ver el detalle completo de una transacción contable.',
  })
  @ApiParam({
    name: 'operationId',
    description: 'El ID de la operación',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asientos contables de la operación',
    type: [LedgerEntryEnrichedDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Operación no encontrada o sin asientos contables.',
  })
  async findByOperationId(@Param('operationId') operationId: string) {
    return this.ledgerEntriesService.findByOperationId(operationId);
  }
}
