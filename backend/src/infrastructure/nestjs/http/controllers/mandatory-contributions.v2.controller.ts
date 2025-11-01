import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
  Delete,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/create-mandatory-contribution.use-case';
import { UpdateMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/update-mandatory-contribution.use-case';
import { DeleteMandatoryContributionUseCase } from '@application/use-cases/mandatory-contributions/delete-mandatory-contribution.use-case';
import { MandatoryContributionResponseDto } from '@application/dto/mandatory-contributions/mandatory-contribution-response.dto';
import { GetMandatoryContributionsQueryHandler } from '@application/queries/mandatory-contributions/get-mandatory-contributions.query-handler';
import { GetMandatoryContributionDetailQueryHandler } from '@application/queries/mandatory-contributions/get-mandatory-contribution-detail.query-handler';
import { CreateMandatoryContributionHttpDto } from '../dto/create-mandatory-contribution-http.dto';
import { UpdateMandatoryContributionHttpDto } from '../dto/update-mandatory-contribution-http.dto';

@ApiTags('Mandatory Contributions V2')
@Controller('v2/mandatory-contributions')
export class MandatoryContributionsV2Controller {
  constructor(
    private readonly getContributionsQuery: GetMandatoryContributionsQueryHandler,
    private readonly getContributionDetailQuery: GetMandatoryContributionDetailQueryHandler,
    private readonly createUseCase: CreateMandatoryContributionUseCase,
    private readonly updateUseCase: UpdateMandatoryContributionUseCase,
    private readonly deleteUseCase: DeleteMandatoryContributionUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all mandatory contributions',
    description: 'Returns a list of all mandatory contributions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of mandatory contributions',
    type: [MandatoryContributionResponseDto],
  })
  async list(): Promise<MandatoryContributionResponseDto[]> {
    return await this.getContributionsQuery.execute();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new mandatory contribution',
    description:
      'Creates a new mandatory contribution with the provided information',
  })
  @ApiBody({
    type: CreateMandatoryContributionHttpDto,
    description: 'Mandatory contribution data to create',
  })
  @ApiResponse({
    status: 201,
    description: 'Mandatory contribution created successfully',
    type: MandatoryContributionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Body() body: CreateMandatoryContributionHttpDto,
  ): Promise<MandatoryContributionResponseDto> {
    try {
      const result = await this.createUseCase.execute({
        assetType: body.asset_type,
        value: body.value,
      });
      return result;
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      } else {
        console.error(String(e));
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get mandatory contribution details by ID',
    description:
      'Returns detailed information about a specific mandatory contribution',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the mandatory contribution',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Mandatory contribution details',
    type: MandatoryContributionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Mandatory contribution not found',
  })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MandatoryContributionResponseDto> {
    try {
      const result = await this.getContributionDetailQuery.execute(id);
      return result;
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error(String(e));
      }
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update mandatory contribution information',
    description:
      'Partially updates a mandatory contribution information. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the mandatory contribution to update',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: UpdateMandatoryContributionHttpDto,
    description: 'Mandatory contribution data to update (all fields optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Mandatory contribution updated successfully',
    type: MandatoryContributionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiNotFoundResponse({
    description: 'Mandatory contribution not found',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMandatoryContributionHttpDto,
  ): Promise<MandatoryContributionResponseDto> {
    try {
      const result = await this.updateUseCase.execute({
        id,
        assetType: body.asset_type,
        value: body.value,
      });
      return result;
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error(String(e));
      }
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a mandatory contribution',
    description: 'Deletes a mandatory contribution permanently (hard delete).',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the mandatory contribution to delete',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Mandatory contribution deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Mandatory contribution not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.deleteUseCase.execute({ id });
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error(String(e));
      }
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
  }
}
