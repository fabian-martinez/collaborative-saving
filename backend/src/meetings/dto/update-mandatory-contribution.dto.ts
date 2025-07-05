import { PartialType } from '@nestjs/swagger';
import { CreateMandatoryContributionDto } from './create-mandatory-contribution.dto';

export class UpdateMandatoryContributionDto extends PartialType(
  CreateMandatoryContributionDto,
) {}
