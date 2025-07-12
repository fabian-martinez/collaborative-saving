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

  @Get('status')
  async getRevaluationStatus(
    @Param('meetingId') meetingId: string,
  ): Promise<{ executed: boolean }> {
    const executed =
      await this.assetRevaluationService.isRevaluationExecuted(meetingId);
    return { executed };
  }

  @Post()
  executeRevaluation(
    @Param('meetingId') meetingId: string,
  ): Promise<RevaluationPreviewResult> {
    return this.assetRevaluationService.executeRevaluation(meetingId);
  }
}
