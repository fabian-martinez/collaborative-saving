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
import { UpdateMemberUseCase } from '@application/use-cases/members/update-member.use-case';
import { DeleteMemberUseCase } from '@application/use-cases/members/delete-member.use-case';
import { CreateMemberUseCase } from '@application/use-cases/members/create-member.use-case';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { UpdateMemberHttpDto } from '../dto/update-member-http.dto';
import { CreateMemberHttpDto } from '../dto/create-member-http.dto';
import { DeleteMemberResponseDto } from '../dto/delete-member-response.dto';

@ApiTags('Members V2')
@Controller('v2/members')
export class MembersV2Controller {
  constructor(
    private readonly getMembersQuery: GetMembersQueryHandler,
    private readonly getMemberDetailQuery: GetMemberDetailQueryHandler,
    private readonly createMemberUseCase: CreateMemberUseCase,
    private readonly updateMemberUseCase: UpdateMemberUseCase,
    private readonly deleteMemberUseCase: DeleteMemberUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all active members',
    description: 'Returns a list of all active (non-deleted) members',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active members',
    type: [MemberResponseDto],
  })
  async list(): Promise<MemberResponseDto[]> {
    return await this.getMembersQuery.execute();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new member',
    description: 'Creates a new member with the provided information',
  })
  @ApiBody({
    type: CreateMemberHttpDto,
    description: 'Member data to create',
  })
  @ApiResponse({
    status: 201,
    description: 'Member created successfully',
    type: MemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data (e.g., invalid email format)',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() body: CreateMemberHttpDto): Promise<MemberResponseDto> {
    try {
      const result = await this.createMemberUseCase.execute(body);
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
    summary: 'Get member details by ID',
    description: 'Returns detailed information about a specific member',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member details',
    type: MemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found or deleted',
  })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberResponseDto> {
    try {
      const result = await this.getMemberDetailQuery.execute(id);
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
    summary: 'Update member information',
    description:
      "Partially updates a member's information. Only provided fields will be updated.",
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member to update',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: UpdateMemberHttpDto,
    description: 'Member data to update (all fields optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Member updated successfully',
    type: MemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data (e.g., invalid email format)',
  })
  @ApiNotFoundResponse({
    description: 'Member not found or deleted',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMemberHttpDto,
  ): Promise<MemberResponseDto> {
    try {
      const result = await this.updateMemberUseCase.execute({
        ...body,
        memberId: id,
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
    summary: 'Soft delete a member',
    description:
      'Marks a member as deleted (soft delete). The member will be set to inactive status and hidden from active member lists, but data is preserved in the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member to delete',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member deleted successfully',
    type: DeleteMemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found or already deleted',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteMemberResponseDto> {
    try {
      await this.deleteMemberUseCase.execute({ memberId: id });
      return { success: true } as DeleteMemberResponseDto;
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
