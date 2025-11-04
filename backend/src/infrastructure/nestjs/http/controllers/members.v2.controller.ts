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
import { MemberDueResponseDto } from '@application/dto/members/member-due-response.dto';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { GetMemberDuesForActiveMeetingQueryHandler } from '@application/queries/members/get-member-dues-for-active-meeting.query-handler';
import { UpdateMemberHttpDto } from '../dto/update-member-http.dto';
import { CreateMemberHttpDto } from '../dto/create-member-http.dto';
import { DeleteMemberResponseDto } from '../dto/delete-member-response.dto';

@ApiTags('Members V2')
@Controller('v2/members')
export class MembersV2Controller {
  constructor(
    private readonly getMembersQuery: GetMembersQueryHandler,
    private readonly getMemberDetailQuery: GetMemberDetailQueryHandler,
    private readonly getMemberDuesQuery: GetMemberDuesForActiveMeetingQueryHandler,
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
    examples: {
      example: {
        summary: 'List of active members',
        value: [
          {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'Juan Pérez',
            email: 'juan.perez@example.com',
            role: 'member',
            identificationNumber: '1234567890',
            status: 'active',
            address: 'Calle 123, Ciudad',
            phone: '+57 300 123 4567',
            beneficiary: 'María Pérez',
            registrationDate: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
            name: 'María García',
            email: 'maria.garcia@example.com',
            role: 'member',
            status: 'active',
            registrationDate: '2024-02-20T14:20:00Z',
            createdAt: '2024-02-20T14:20:00Z',
          },
        ],
      },
    },
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
    examples: {
      example: {
        summary: 'Created member',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          role: 'member',
          identificationNumber: '1234567890',
          status: 'active',
          address: 'Calle 123, Ciudad',
          phone: '+57 300 123 4567',
          beneficiary: 'María Pérez',
          registrationDate: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
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
    examples: {
      example: {
        summary: 'Member details',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          role: 'member',
          identificationNumber: '1234567890',
          status: 'active',
          address: 'Calle 123, Ciudad',
          phone: '+57 300 123 4567',
          beneficiary: 'María Pérez',
          registrationDate: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
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
    examples: {
      example: {
        summary: 'Updated member',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Juan Pérez',
          email: 'juan.perez.updated@example.com',
          role: 'member',
          identificationNumber: '1234567890',
          status: 'active',
          address: 'Calle 456, Nueva Ciudad',
          phone: '+57 300 123 4567',
          beneficiary: 'María Pérez',
          registrationDate: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
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
    examples: {
      example: {
        summary: 'Member deleted',
        value: {
          success: true,
        },
      },
    },
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

  @Get(':id/dues')
  @ApiOperation({
    summary: 'Get member dues for active meeting',
    description:
      'Returns all pending obligations (dues) for a member in the active meeting, including mandatory contributions, stock fees, and loan payments.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member dues retrieved successfully',
    type: [MemberDueResponseDto],
    examples: {
      example: {
        summary: 'Member dues',
        value: [
          {
            type: 'mandatory_contribution',
            description: 'Aporte obligatorio mensual',
            amount: 50000,
            referenceId: 'mc-123e4567-e89b-12d3-a456-426614174000',
            monthlyContribution: 50000,
            creationDate: '2024-01-15T10:30:00Z',
          },
          {
            type: 'stock_fee',
            description: 'Cuota de acciones',
            amount: 25000,
            referenceId: 'stock-123e4567-e89b-12d3-a456-426614174000',
            monthlyContribution: 25000,
            stockQuantity: 10,
            creationDate: '2024-01-15T10:30:00Z',
          },
          {
            type: 'loan_payment',
            description: 'Pago de préstamo',
            amount: 150000,
            referenceId: 'loan-123e4567-e89b-12d3-a456-426614174000',
            details: {
              interest: 20000,
              principal: 130000,
              outstanding_balance: 1000000,
            },
            creationDate: '2024-01-15T10:30:00Z',
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found or no active meeting exists',
  })
  async getDues(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberDueResponseDto[]> {
    try {
      return await this.getMemberDuesQuery.execute(id);
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
