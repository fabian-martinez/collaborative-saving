import { Module } from '@nestjs/common';
import { AssetRevaluationService } from './asset-revaluation.service';
import { AssetRevaluationController } from './asset-revaluation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from '../meetings/entities/meeting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting])],
  providers: [AssetRevaluationService],
  controllers: [AssetRevaluationController],
  exports: [AssetRevaluationService],
})
export class AssetRevaluationModule {}
