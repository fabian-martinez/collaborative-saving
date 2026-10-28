/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MemberRole } from '@domain/enums/member-role.enum';
import { GetPendingPaymentsQueryHandler } from '@application/queries/pending-payments/get-pending-payments.query-handler';
import { GetPendingPaymentsQueryDto } from '@application/dto/pending-payments/get-pending-payments-query.dto';
import { PendingMemberPaymentResponseDto } from '@application/dto/pending-payments/pending-member-payment-response.dto';
import { UpdatePendingPaymentUseCase } from '@application/use-cases/pending-payments/update-pending-payment.use-case';
import { UpdatePendingPaymentDto } from '@application/dto/pending-payments/update-pending-payment.dto';
import { DeletePendingPaymentUseCase } from '@application/use-cases/pending-payments/delete-pending-payment.use-case';

@ApiTags('Pending Payments V2')
@ApiBearerAuth()
@Controller('v2/pending-payments')
export class PendingPaymentsController {
  constructor(
    private readonly getPendingPaymentsQuery: GetPendingPaymentsQueryHandler,
    private readonly updatePendingPaymentUseCase: UpdatePendingPaymentUseCase,
    private readonly deletePendingPaymentUseCase: DeletePendingPaymentUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List pending member payments',
    description:
      'Retrieves pending member payments filtered by status, member, meeting, or type. Accessible to all authenticated members for fund transparency.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending payments retrieved successfully',
  })
  async getPendingPayments(
    @Query() query: GetPendingPaymentsQueryDto,
  ): Promise<PendingMemberPaymentResponseDto[]> {
    return this.getPendingPaymentsQuery.execute(query);
  }

  @Patch(':id')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a pending member payment',
    description:
      'Updates the amount, status, or notes of a pending member payment. Restricted to administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the pending payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending payment updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID or request payload',
  })
  @ApiForbiddenResponse({
    description: 'Requires administrator role',
  })
  async updatePendingPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePendingPaymentDto,
  ): Promise<void> {
    await this.updatePendingPaymentUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a pending member payment',
    description:
      'Deletes a pending member payment by its UUID. Restricted to administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the pending payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending payment deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiForbiddenResponse({
    description: 'Requires administrator role',
  })
  async deletePendingPayment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deletePendingPaymentUseCase.execute(id);
  }
}
