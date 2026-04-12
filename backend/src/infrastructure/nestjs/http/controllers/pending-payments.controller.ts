import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { GetPendingPaymentsQueryHandler } from '@application/queries/pending-payments/get-pending-payments.query-handler';
import { GetPendingPaymentsQueryDto } from '@application/dto/pending-payments/get-pending-payments-query.dto';
import { PendingMemberPaymentResponseDto } from '@application/dto/pending-payments/pending-member-payment-response.dto';
import { UpdatePendingPaymentUseCase } from '@application/use-cases/pending-payments/update-pending-payment.use-case';
import { UpdatePendingPaymentDto } from '@application/dto/pending-payments/update-pending-payment.dto';
import { DeletePendingPaymentUseCase } from '@application/use-cases/pending-payments/delete-pending-payment.use-case';

@Controller('v2/pending-payments')
export class PendingPaymentsController {
  constructor(
    private readonly getPendingPaymentsQuery: GetPendingPaymentsQueryHandler,
    private readonly updatePendingPaymentUseCase: UpdatePendingPaymentUseCase,
    private readonly deletePendingPaymentUseCase: DeletePendingPaymentUseCase,
  ) {}

  @Get()
  async getPendingPayments(
    @Query() query: GetPendingPaymentsQueryDto,
  ): Promise<PendingMemberPaymentResponseDto[]> {
    return this.getPendingPaymentsQuery.execute(query);
  }

  @Patch(':id')
  async updatePendingPayment(
    @Param('id') id: string,
    @Body() dto: UpdatePendingPaymentDto,
  ): Promise<void> {
    await this.updatePendingPaymentUseCase.execute(id, dto);
  }

  @Delete(':id')
  async deletePendingPayment(@Param('id') id: string): Promise<void> {
    await this.deletePendingPaymentUseCase.execute(id);
  }
}
