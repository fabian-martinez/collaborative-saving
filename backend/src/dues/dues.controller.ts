import { Controller, Get, Param, ParseFloatPipe, Query } from '@nestjs/common';
import { DuesService } from './dues.service';
import { MemberDue } from './entities/member-due.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

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

  @Get('calculate-insurance/:memberId')
  @ApiOperation({ summary: 'Calculate insurance amount for a member' })
  @ApiQuery({
    name: 'capitalPayment',
    required: false,
    type: Number,
    description: 'Optional capital payment to consider in the calculation.',
  })
  @ApiResponse({
    status: 200,
    description: 'The calculated insurance amount.',
    type: Number,
  })
  calculateInsurance(
    @Param('memberId') memberId: string,
    @Query('capitalPayment', new ParseFloatPipe({ optional: true }))
    capitalPayment?: number,
  ): Promise<{ insuranceAmount: number }> {
    return this.duesService.calculateInsurance(memberId, capitalPayment);
  }
}
