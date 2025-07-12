import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { Operation } from './entities/operation.entity';

@ApiTags('operations')
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  async findAll(@Query('meetingId') meetingId?: string): Promise<Operation[]> {
    return this.operationsService.findAll({ meetingId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single operation by its ID' })
  @ApiParam({ name: 'id', description: 'The ID of the operation' })
  @ApiResponse({
    status: 200,
    description: 'The operation, including member and ledger entry details.',
    type: Operation,
  })
  @ApiResponse({ status: 404, description: 'Operation not found.' })
  findOne(@Param('id') id: string) {
    return this.operationsService.findOne(id);
  }
}
