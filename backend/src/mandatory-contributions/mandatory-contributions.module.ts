import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MandatoryContribution } from './entities/mandatory-contribution.entity';
import { MandatoryContributionsService } from './mandatory-contributions.service';
import { MandatoryContributionsController } from './mandatory-contributions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MandatoryContribution])],
  providers: [MandatoryContributionsService],
  controllers: [MandatoryContributionsController],
  exports: [MandatoryContributionsService],
})
export class MandatoryContributionsModule {}
