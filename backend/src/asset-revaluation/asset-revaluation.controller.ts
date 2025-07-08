import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  AssetRevaluationService,
  RevaluationPreviewResult,
} from './asset-revaluation.service';

@Controller('meetings/:meetingId/revaluation')
export class AssetRevaluationController {
  constructor(
    private readonly assetRevaluationService: AssetRevaluationService,
  ) {}

  @Get('preview')
  getRevaluationPreview(
    @Param('meetingId') meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    return this.assetRevaluationService.getRevaluationPreview(meetingId);
  }

  @Post()
  executeRevaluation(
    @Param('meetingId') meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    return this.assetRevaluationService.executeRevaluation(meetingId);
  }
}
