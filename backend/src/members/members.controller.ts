import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Member } from './entities/member.entity';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new member' })
  @ApiResponse({
    status: 201,
    description: 'The member has been successfully created.',
    type: Member,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all members' })
  @ApiResponse({
    status: 200,
    description: 'Return all members.',
    type: [Member],
  })
  findAll() {
    return this.membersService.findAll();
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Get all deleted members' })
  @ApiResponse({
    status: 200,
    description: 'Return all deleted members.',
    type: [Member],
  })
  findDeleted() {
    return this.membersService.findDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member by id' })
  @ApiParam({ name: 'id', description: 'The ID of the member' })
  @ApiResponse({ status: 200, description: 'Return the member.', type: Member })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a member' })
  @ApiParam({ name: 'id', description: 'The ID of the member to update' })
  @ApiResponse({
    status: 200,
    description: 'The member has been successfully updated.',
    type: Member,
  })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a member' })
  @ApiParam({ name: 'id', description: 'The ID of the member to delete' })
  @ApiResponse({
    status: 200,
    description: 'The member has been successfully soft-deleted.',
  })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}
