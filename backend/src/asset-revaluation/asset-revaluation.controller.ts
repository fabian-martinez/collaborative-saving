import { Controller, Param, Post } from '@nestjs/common';
import { AssetRevaluationService } from './asset-revaluation.service';

@Controller('asset-revaluation')
export class AssetRevaluationController {
  constructor(
    private readonly assetRevaluationService: AssetRevaluationService,
  ) {}

  @Post('meetings/:meetingId')
  revaluateAssets(@Param('meetingId') meetingId: string) {
    return this.assetRevaluationService.revaluateAssets(meetingId);
  }
}
