import { Controller, Get, Param, Post } from '@nestjs/common';
import { AssetRevaluationService } from './asset-revaluation.service';
import { RevaluationPreviewResult } from './types';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RevaluationPreviewResultDto } from './dto/revaluation-preview-result.dto';

@ApiTags('Asset Revaluation')
@Controller('meetings/:meetingId/revaluation')
export class AssetRevaluationController {
  constructor(
    private readonly assetRevaluationService: AssetRevaluationService,
  ) {}

  @Get('preview')
  @ApiOperation({
    summary:
      'Obtiene un preview de la revalorización de activos para una reunión',
  })
  @ApiParam({
    name: 'meetingId',
    type: String,
    description: 'ID de la reunión',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview de la revalorización de activos',
    type: RevaluationPreviewResultDto,
  })
  getRevaluationPreview(
    @Param('meetingId') meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    return this.assetRevaluationService.getRevaluationPreview(meetingId);
  }

  @Post()
  @ApiOperation({
    summary: 'Ejecuta la revalorización de activos para una reunión',
  })
  @ApiParam({
    name: 'meetingId',
    type: String,
    description: 'ID de la reunión',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado de la revalorización ejecutada',
    type: RevaluationPreviewResultDto,
  })
  executeRevaluation(
    @Param('meetingId') meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    return this.assetRevaluationService.executeRevaluation(meetingId);
  }
}
