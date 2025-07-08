import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MandatoryContributionsService } from './mandatory-contributions.service';
import { CreateMandatoryContributionDto } from './dto/create-mandatory-contribution.dto';
import { UpdateMandatoryContributionDto } from './dto/update-mandatory-contribution.dto';

@Controller('mandatory-contributions')
export class MandatoryContributionsController {
  constructor(
    private readonly mandatoryContributionsService: MandatoryContributionsService,
  ) {}

  @Post()
  create(
    @Body() createMandatoryContributionDto: CreateMandatoryContributionDto,
  ) {
    return this.mandatoryContributionsService.create(
      createMandatoryContributionDto,
    );
  }

  @Get()
  findAll() {
    return this.mandatoryContributionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mandatoryContributionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMandatoryContributionDto: UpdateMandatoryContributionDto,
  ) {
    return this.mandatoryContributionsService.update(
      id,
      updateMandatoryContributionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mandatoryContributionsService.remove(id);
  }
}
