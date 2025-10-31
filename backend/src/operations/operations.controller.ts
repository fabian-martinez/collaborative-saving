import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { Operation } from './entities/operation.entity';
import { FindOperationsDto } from './dto/find-operations.dto';

@ApiTags('operations')
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar operaciones con filtros y paginación' })
  @ApiResponse({
    status: 200,
    description:
      'Lista paginada de operaciones, incluyendo detalles de miembro y asientos contables.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Operation' },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    type: String,
    description: 'Filtrar por ID de reunión',
  })
  @ApiQuery({
    name: 'memberId',
    required: false,
    type: String,
    description: 'Filtrar por ID de miembro',
  })
  @ApiQuery({
    name: 'operationType',
    required: false,
    enum: [
      'MANDATORY_CONTRIBUTION',
      'STOCK_FEE',
      'LOAN_PAYMENT',
      'FEE',
      'STOCK_PURCHASE',
      'LOAN_DISBURSEMENT',
      'MONTHLY_PAYMENT',
      'ASSET_REVALUATION',
      'UNDEFINED',
    ],
    description: 'Filtrar por tipo de operación',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Fecha desde (ISO 8601)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Fecha hasta (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (por defecto 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Resultados por página (por defecto 20)',
  })
  async findAll(@Query() query: FindOperationsDto) {
    return this.operationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una operación por su ID' })
  @ApiParam({ name: 'id', description: 'El ID de la operación' })
  @ApiResponse({
    status: 200,
    description:
      'La operación, incluyendo detalles de miembro y asientos contables.',
    type: Operation,
  })
  @ApiResponse({ status: 404, description: 'Operación no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.operationsService.findOne(id);
  }
}
