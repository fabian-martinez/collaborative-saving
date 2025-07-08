import { Controller, Get, Param } from '@nestjs/common';
import { DuesService } from './dues.service';
import { MemberDue } from './entities/member-due.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('dues')
@Controller('dues')
export class DuesController {
  constructor(private readonly duesService: DuesService) {}

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get all dues for a member' })
  @ApiResponse({
    status: 200,
    description: 'A list of all dues for the member.',
    type: [Object],
  })
  getMemberDues(@Param('memberId') memberId: string): Promise<MemberDue[]> {
    return this.duesService.getMemberDues(memberId);
  }

  @Get('active-meeting/member/:memberId')
  @ApiOperation({ summary: 'Get all dues for a member for the active meeting' })
  @ApiResponse({
    status: 200,
    description: 'A list of all dues for the member for the active meeting.',
    type: [Object],
  })
  getMemberDuesForActiveMeeting(
    @Param('memberId') memberId: string,
  ): Promise<MemberDue[]> {
    return this.duesService.getMemberDuesForActiveMeeting(memberId);
  }
}
