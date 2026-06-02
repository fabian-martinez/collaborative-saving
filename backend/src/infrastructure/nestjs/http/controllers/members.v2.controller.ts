import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  ParseFloatPipe,
  Patch,
  Body,
  Delete,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UpdateMemberUseCase } from '@application/use-cases/members/update-member.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { RecordExtraordinaryLoanPaymentHttpDto } from '../dto/record-extraordinary-loan-payment-http.dto';
import { DeleteMemberUseCase } from '@application/use-cases/members/delete-member.use-case';
import { CreateMemberUseCase } from '@application/use-cases/members/create-member.use-case';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';
import { MemberDueResponseDto } from '@application/dto/members/member-due-response.dto';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { GetMemberDuesForActiveMeetingQueryHandler } from '@application/queries/members/get-member-dues-for-active-meeting.query-handler';
import { GetMemberPaymentsQueryHandler } from '@application/queries/members/get-member-payments.query-handler';
import { GetMemberPurchasesQueryHandler } from '@application/queries/members/get-member-purchases.query-handler';
import { GetMemberStockExchangesQueryHandler } from '@application/queries/members/get-member-stock-exchanges.query-handler';
import { GetMemberStockTransfersQueryHandler } from '@application/queries/members/get-member-stock-transfers.query-handler';
import { GetMemberStockLoanPaymentsQueryHandler } from '@application/queries/members/get-member-stock-loan-payments.query-handler';
import { GetMemberPaymentScheduleQueryHandler } from '@application/queries/members/get-member-payment-schedule.query-handler';
import { GetMemberStockSubscriptionsQueryHandler } from '@application/queries/members/get-member-stock-subscriptions.query-handler';
import { GetStockSubscriptionByIdQueryHandler } from '@application/queries/members/get-stock-subscription-by-id.query-handler';
import { GetMemberLoansQueryHandler } from '@application/queries/loans/get-member-loans.query-handler';
import { UpdateMemberHttpDto } from '../dto/update-member-http.dto';
import { CreateMemberHttpDto } from '../dto/create-member-http.dto';
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/members/record-monthly-payments.use-case';
import { RecordMonthlyPaymentsResponseDto } from '@application/dto/members/record-monthly-payments-response.dto';
import { RecordMonthlyPaymentsHttpDto } from '../dto/record-monthly-payments-http.dto';
import { MemberResponseHttpDto } from '../dto/member-response-http.dto';
import { MemberDueResponseHttpDto } from '../dto/member-due-response-http.dto';
import { RecordMonthlyPaymentsResponseHttpDto } from '../dto/record-monthly-payments-response-http.dto';
import { GetMemberPaymentsQueryHttpDto } from '../dto/get-member-payments-query-http.dto';
import { GetMemberPurchasesQueryHttpDto } from '../dto/get-member-purchases-query-http.dto';
import { GetMemberPurchasesQueryDto } from '@application/dto/members/get-member-purchases-query.dto';
import { GetMemberStockModificationsQueryHttpDto } from '../dto/get-member-stock-modifications-query-http.dto';
import { MemberPaymentResponseHttpDto } from '../dto/member-payment-response-http.dto';
import { MemberPurchaseResponseHttpDto } from '../dto/member-purchase-response-http.dto';
import { MemberPaymentResponseDto } from '@application/dto/members/member-payment-response.dto';
import { MemberPurchaseResponseDto } from '@application/dto/members/member-purchase-response.dto';
import { PaymentFilterType } from '@domain/enums/payment-filter-type.enum';
import { CalculateMemberInsuranceUseCase } from '@application/use-cases/members/calculate-member-insurance.use-case';
import { PurchaseStockUseCase } from '@application/use-cases/members/purchase-stock.use-case';
import { PurchaseStockResponseDto } from '@application/dto/members/purchase-stock-response.dto';
import { PurchaseStockHttpDto } from '../dto/purchase-stock-http.dto';
import { PurchaseStockResponseHttpDto } from '../dto/purchase-stock-response-http.dto';

import { ProcessStockExchangeUseCase } from '@application/use-cases/members/process-stock-exchange.use-case';
import { ProcessStockTransferUseCase } from '@application/use-cases/members/process-stock-transfer.use-case';
import { ProcessStockLoanPaymentUseCase } from '@application/use-cases/members/process-stock-loan-payment.use-case';
import { StockExchangeHttpDto } from '../dto/stock-exchange-http.dto';
import { StockTransferHttpDto } from '../dto/stock-transfer-http.dto';
import { StockLoanPaymentHttpDto } from '../dto/stock-loan-payment-http.dto';
import { StockOperationResponseHttpDto } from '../dto/stock-operation-response-http.dto';
import { StockOperationResponseDto } from '@application/dto/members/stock-operation-response.dto';
import { StockExchangeResponseHttpDto } from '../dto/stock-exchange-response-http.dto';
import { StockTransferResponseHttpDto } from '../dto/stock-transfer-response-http.dto';
import { StockLoanPaymentResponseHttpDto } from '../dto/stock-loan-payment-response-http.dto';
import { StockExchangeResponseDto } from '@application/dto/members/stock-exchange-response.dto';
import { StockTransferResponseDto } from '@application/dto/members/stock-transfer-response.dto';
import { StockLoanPaymentResponseDto } from '@application/dto/members/stock-loan-payment-response.dto';
import { GetPaymentScheduleQueryHttpDto } from '../dto/get-payment-schedule-query-http.dto';
import { PaymentScheduleResponseHttpDto } from '../dto/payment-schedule-response-http.dto';
import { StockSubscriptionResponseHttpDto } from '../dto/stock-subscription-response-http.dto';
import { PaymentScheduleResponseDto } from '@application/dto/members/payment-schedule-response.dto';
import { StockSubscriptionResponseDto } from '@application/dto/members/stock-subscription-response.dto';
import { PaymentItemDto } from '@application/dto/members/payment-item.dto';
import { LoanResponseHttpDto } from '../dto/loan-response-http.dto';
import { LoanResponseDto } from '@application/dto/loans/loan-response.dto';
import { RolesGuard } from '@infrastructure/nestjs/auth/guards/roles.guard';
import { Roles } from '@infrastructure/nestjs/auth/decorators/roles.decorator';
import { MemberRole } from '@domain/enums/member-role.enum';

@ApiTags('Members V2')
@Controller('v2/members')
@UseGuards(RolesGuard)
export class MembersV2Controller {
  constructor(
    private readonly getMembersQuery: GetMembersQueryHandler,
    private readonly getMemberDetailQuery: GetMemberDetailQueryHandler,
    private readonly getMemberDuesQuery: GetMemberDuesForActiveMeetingQueryHandler,
    private readonly getMemberPaymentsQuery: GetMemberPaymentsQueryHandler,
    private readonly getMemberPurchasesQuery: GetMemberPurchasesQueryHandler,
    private readonly getMemberStockExchangesQuery: GetMemberStockExchangesQueryHandler,
    private readonly getMemberStockTransfersQuery: GetMemberStockTransfersQueryHandler,
    private readonly getMemberStockLoanPaymentsQuery: GetMemberStockLoanPaymentsQueryHandler,
    private readonly getMemberPaymentScheduleQuery: GetMemberPaymentScheduleQueryHandler,
    private readonly getMemberStockSubscriptionsQuery: GetMemberStockSubscriptionsQueryHandler,
    private readonly getStockSubscriptionByIdQuery: GetStockSubscriptionByIdQueryHandler,
    private readonly getMemberLoansQuery: GetMemberLoansQueryHandler,
    private readonly createMemberUseCase: CreateMemberUseCase,
    private readonly updateMemberUseCase: UpdateMemberUseCase,
    private readonly deleteMemberUseCase: DeleteMemberUseCase,
    private readonly recordMonthlyPaymentsUseCase: RecordMonthlyPaymentsUseCase,
    private readonly calculateMemberInsuranceUseCase: CalculateMemberInsuranceUseCase,
    private readonly purchaseStockUseCase: PurchaseStockUseCase,
    private readonly processStockExchangeUseCase: ProcessStockExchangeUseCase,
    private readonly processStockTransferUseCase: ProcessStockTransferUseCase,
    private readonly processStockLoanPaymentUseCase: ProcessStockLoanPaymentUseCase,
    private readonly recordLoanPaymentUseCase: RecordLoanPaymentUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all active members',
    description: 'Returns a list of all active (non-deleted) members',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active members',
    type: [MemberResponseHttpDto],
    examples: {
      example: {
        summary: 'List of active members',
        value: [
          {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'Juan Pérez',
            email: 'juan.perez@example.com',
            role: 'member',
            identification_number: '1234567890',
            status: 'active',
            address: 'Calle 123, Ciudad',
            phone: '+57 300 123 4567',
            beneficiary: 'María Pérez',
            registration_date: '2024-01-15T10:30:00Z',
            created_at: '2024-01-15T10:30:00Z',
          },
          {
            id: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
            name: 'María García',
            email: 'maria.garcia@example.com',
            role: 'member',
            status: 'active',
            registration_date: '2024-02-20T14:20:00Z',
            created_at: '2024-02-20T14:20:00Z',
          },
        ],
      },
    },
  })
  async list(): Promise<MemberResponseHttpDto[]> {
    const members = await this.getMembersQuery.execute();
    return members.map((m) => this.mapMemberToHttp(m));
  }

  @Post()
  @Roles(MemberRole.ADMIN)
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
    type: MemberResponseHttpDto,
    examples: {
      example: {
        summary: 'Created member',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          role: 'member',
          identification_number: '1234567890',
          status: 'active',
          address: 'Calle 123, Ciudad',
          phone: '+57 300 123 4567',
          beneficiary: 'María Pérez',
          registration_date: '2024-01-15T10:30:00Z',
          created_at: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data (e.g., invalid email format)',
  })
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Body() body: CreateMemberHttpDto,
  ): Promise<MemberResponseHttpDto> {
    const result = await this.createMemberUseCase.execute(body);
    return this.mapMemberToHttp(result);
  }

  @Post(':id/extraordinary-loan-payment')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Record an extraordinary loan payment (principal payment)',
    description:
      'Records a cash payment directly to the loan principal without throwing duplicate monthly payment errors.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: RecordExtraordinaryLoanPaymentHttpDto,
    description: 'Extraordinary payment data',
  })
  @ApiResponse({
    status: 201,
    description: 'Extraordinary payment recorded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async recordExtraordinaryLoanPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RecordExtraordinaryLoanPaymentHttpDto,
  ) {
    const result = await this.recordLoanPaymentUseCase.execute({
      loanId: body.loanId,
      meetingId: body.meetingId,
      totalPaymentAmount: body.amount,
      forcedPrincipalAmount: body.amount,
      forcedInterestAmount: 0,
      notes: body.notes || `Abono extraordinario a capital prestamo`,
    });
    return {
      ...result,
      memberId: id,
    };
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
    type: MemberResponseHttpDto,
    examples: {
      example: {
        summary: 'Member details',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          role: 'member',
          identification_number: '1234567890',
          status: 'active',
          address: 'Calle 123, Ciudad',
          phone: '+57 300 123 4567',
          beneficiary: 'María Pérez',
          registration_date: '2024-01-15T10:30:00Z',
          created_at: '2024-01-15T10:30:00Z',
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
  ): Promise<MemberResponseHttpDto> {
    const result = await this.getMemberDetailQuery.execute(id);
    return this.mapMemberToHttp(result);
  }

  @Get(':id/loans')
  @ApiOperation({
    summary: 'Get all loans for a member',
    description: 'Returns all loans belonging to a specific member',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the member',
    example: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
  })
  @ApiResponse({
    status: 200,
    description: 'Member loans retrieved successfully',
    type: [LoanResponseHttpDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  async getMemberLoans(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanResponseHttpDto[]> {
    const loans = await this.getMemberLoansQuery.execute(id);
    return loans.map((loan) => this.mapLoanToHttp(loan));
  }

  @Patch(':id')
  @Roles(MemberRole.ADMIN)
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
    type: MemberResponseHttpDto,
    examples: {
      example: {
        summary: 'Updated member',
        value: {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Juan Pérez',
          email: 'juan.perez.updated@example.com',
          role: 'member',
          identification_number: '1234567890',
          status: 'active',
          address: 'Calle 456, Nueva Ciudad',
          phone: '+57 300 123 4567',
          beneficiary: 'María Pérez',
          registration_date: '2024-01-15T10:30:00Z',
          created_at: '2024-01-15T10:30:00Z',
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
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMemberHttpDto,
  ): Promise<MemberResponseHttpDto> {
    const result = await this.updateMemberUseCase.execute({
      ...body,
      memberId: id,
    });
    return this.mapMemberToHttp(result);
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN)
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
    status: 204,
    description: 'Member deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found or already deleted',
  })
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteMemberUseCase.execute({ memberId: id });
  }

  @Get(':id/dues')
  @ApiOperation({
    summary: 'Get member dues and obligations',
    description:
      'Returns all pending obligations (dues) for a member, including mandatory contributions, stock fees, and loan payments. Works with or without an active meeting. If there is an active meeting, loan payments are filtered to exclude those already paid in that meeting. If there is no active meeting, all active loans are included.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member dues retrieved successfully',
    type: [MemberDueResponseHttpDto],
    examples: {
      example: {
        summary: 'Member dues',
        value: [
          {
            type: 'mandatory_contribution',
            description: 'Aporte obligatorio mensual',
            amount: 50000,
            reference_id: 'mc-123e4567-e89b-12d3-a456-426614174000',
            monthly_contribution: 50000,
            creation_date: '2024-01-15T10:30:00Z',
          },
          {
            type: 'stock_fee',
            description: 'Cuota de acciones',
            amount: 25000,
            reference_id: 'stock-123e4567-e89b-12d3-a456-426614174000',
            monthly_contribution: 25000,
            stock_quantity: 10,
            creation_date: '2024-01-15T10:30:00Z',
          },
          {
            type: 'loan_payment',
            description: 'Pago de préstamo',
            amount: 150000,
            reference_id: 'loan-123e4567-e89b-12d3-a456-426614174000',
            details: {
              interest: 20000,
              principal: 130000,
              outstanding_balance: 1000000,
            },
            creation_date: '2024-01-15T10:30:00Z',
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  async getDues(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberDueResponseHttpDto[]> {
    const dues = await this.getMemberDuesQuery.execute(id);
    return dues.map((d) => this.mapDueToHttp(d));
  }

  private mapDueToHttp(d: MemberDueResponseDto): MemberDueResponseHttpDto {
    return {
      type: d.type,
      description: d.description,
      amount: d.amount,
      reference_id: d.referenceId,
      details: d.details,
      monthly_contribution: d.monthlyContribution,
      stock_quantity: d.stockQuantity,
      novelty_comment: d.noveltyComment,
      creation_date: d.creationDate,
    };
  }

  @Get(':id/payments')
  @ApiOperation({
    summary: 'Get member payments',
    description:
      'Retrieves all payments made by a member. Supports filtering by payment type and meeting ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by payment type',
    enum: PaymentFilterType,
    example: PaymentFilterType.MONTHLY_PAYMENT,
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filter by meeting ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member payments retrieved successfully',
    type: [MemberPaymentResponseHttpDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or invalid query parameters',
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getPayments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetMemberPaymentsQueryHttpDto,
  ): Promise<MemberPaymentResponseHttpDto[]> {
    // Validation is handled by class-validator in the DTO
    // Exception handling is done by GlobalExceptionFilter
    const queryDto: {
      paymentType?: PaymentFilterType;
      meetingId?: string;
    } = {};
    if (query.type) {
      queryDto.paymentType = query.type;
    }
    if (query.meeting_id) {
      queryDto.meetingId = query.meeting_id;
    }
    const payments = await this.getMemberPaymentsQuery.execute(id, queryDto);
    return payments.map((payment) => this.mapPaymentToHttp(payment));
  }

  @Get(':id/stock-subscriptions')
  @ApiOperation({
    summary: 'Get member stock subscriptions',
    description:
      'Retrieves stock subscriptions for a member. By default, only returns active subscriptions. Use the includeInactive query parameter to include inactive subscriptions as well. This endpoint is useful to determine what operations the member can perform based on their stock holdings.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive subscriptions in the response',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Member stock subscriptions retrieved successfully',
    type: [StockSubscriptionResponseHttpDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getStockSubscriptions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<StockSubscriptionResponseHttpDto[]> {
    // Convert string query param to boolean if provided
    // Query params come as strings from the URL, so we need to parse them
    const includeInactiveBool =
      includeInactive === 'true' || includeInactive === '1';
    const subscriptions = await this.getMemberStockSubscriptionsQuery.execute(
      id,
      includeInactiveBool,
    );
    return subscriptions.map((subscription) =>
      this.mapStockSubscriptionToHttp(subscription),
    );
  }

  @Get(':id/stock-subscriptions/:subscriptionId')
  @ApiOperation({
    summary: 'Get specific stock subscription for a member',
    description:
      'Retrieves a specific stock subscription by ID for a member, including inactive subscriptions. Validates that the subscription belongs to the member.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'The UUID of the stock subscription',
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock subscription retrieved successfully',
    type: StockSubscriptionResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member, stock subscription, or stock not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getStockSubscriptionById(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
  ): Promise<StockSubscriptionResponseHttpDto> {
    const subscription = await this.getStockSubscriptionByIdQuery.execute(
      id,
      subscriptionId,
    );
    return this.mapStockSubscriptionToHttp(subscription);
  }

  @Get(':id/insurance')
  @ApiOperation({
    summary: 'Calculate insurance amount for a member',
    description:
      "Calculates the insurance amount based on the member's active loans and savings. Optionally accepts a capital payment to reduce the debt base.",
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'capitalPayment',
    required: false,
    description: 'Optional capital payment amount to deduct from the debt base',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance calculated successfully',
    schema: {
      type: 'object',
      properties: {
        insurance_amount: {
          type: 'number',
          example: 5000,
        },
      },
    },
  })
  async calculateInsurance(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('capitalPayment', new ParseFloatPipe({ optional: true }))
    capitalPayment?: number,
  ): Promise<{ insurance_amount: number }> {
    const result = await this.calculateMemberInsuranceUseCase.execute({
      memberId: id,
      capitalPayment,
    });
    return { insurance_amount: result.insuranceAmount };
  }

  @Post(':id/payments')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record monthly payments for a member',
    description:
      'Records monthly payments from a member. Supports multiple payment types (stock fees, loan payments, mandatory contributions, fees, insurance, novelties). The memberId is extracted from the URL path parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: RecordMonthlyPaymentsHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Monthly payments recorded successfully',
    schema: {
      type: 'object',
      properties: {
        operation_id: {
          type: 'string',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
        meeting_id: {
          type: 'string',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
        member_id: {
          type: 'string',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
        total_amount: {
          type: 'number',
          example: 150.0,
        },
        ledger_entry_ids: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or validation failed',
  })
  @ApiNotFoundResponse({
    description: 'Member or meeting not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async recordMonthlyPayments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordMonthlyPaymentsHttpDto,
  ): Promise<RecordMonthlyPaymentsResponseHttpDto> {
    // Map HTTP DTO (snake_case) to application DTO (camelCase)
    const payments: PaymentItemDto[] = dto.payments.map((payment) => {
      const paymentDto: PaymentItemDto = {
        type: payment.type,
        amount: payment.amount,
      };
      if (payment.description) {
        paymentDto.description = payment.description;
      }
      if (payment.reference_id) {
        paymentDto.referenceId = payment.reference_id;
      }
      if (payment.novelty_comment) {
        paymentDto.noveltyComment = payment.novelty_comment;
      }
      if (payment.affected_payment_type) {
        paymentDto.affectedPaymentType = payment.affected_payment_type;
      }
      return paymentDto;
    });

    const result = await this.recordMonthlyPaymentsUseCase.execute({
      memberId: id,
      payments,
      ...(dto.meeting_id ? { meetingId: dto.meeting_id } : {}),
    });
    return this.mapRecordMonthlyPaymentsToHttp(result);
  }

  @Post(':id/purchase')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Purchase stocks for a member',
    description:
      'Records a stock purchase for a member. Supports cash payment, loan financing, or a combination of both. The memberId is extracted from the URL path parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: PurchaseStockHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Stock purchase recorded successfully',
    type: PurchaseStockResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or validation failed',
  })
  @ApiNotFoundResponse({
    description: 'Member, stock, or meeting not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async purchaseStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PurchaseStockHttpDto,
  ): Promise<PurchaseStockResponseHttpDto> {
    const result = await this.purchaseStockUseCase.execute({
      memberId: id,
      stockId: dto.stock_id,
      quantity: dto.quantity,
      cashAmount: dto.cash_amount,
      loanDetails: dto.loan_details
        ? {
            interest_rate: dto.loan_details.interest_rate,
            loan_type: dto.loan_details.loan_type,
          }
        : undefined,
      meetingId: dto.meeting_id,
    });
    return this.mapPurchaseStockToHttp(result);
  }

  @Get(':id/purchase')
  @ApiOperation({
    summary: 'Get member stock purchases',
    description:
      'Retrieves all stock purchases made by a member. Supports filtering by meeting ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'meeting_id',
    required: false,
    description: 'Filter by meeting ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Member purchases retrieved successfully',
    type: [MemberPurchaseResponseHttpDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or invalid query parameters',
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getPurchases(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetMemberPurchasesQueryHttpDto,
  ): Promise<MemberPurchaseResponseHttpDto[]> {
    const queryDto: GetMemberPurchasesQueryDto = query.meeting_id
      ? { meetingId: query.meeting_id }
      : {};
    const purchases = await this.getMemberPurchasesQuery.execute(id, queryDto);
    return purchases.map((purchase) => this.mapPurchaseToHttp(purchase));
  }

  @Post(':id/exchange')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Intercambiar acciones de un tipo a otro',
    description:
      'Permite convertir acciones existentes en otro tipo administrando las diferencias vía efectivo o crédito.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del socio que realiza el intercambio',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: StockExchangeHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Intercambio procesado correctamente',
    type: StockOperationResponseHttpDto,
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos para el intercambio' })
  @ApiNotFoundResponse({
    description: 'No se encontró el socio, la suscripción o la reunión',
  })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async exchangeStocks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockExchangeHttpDto,
  ): Promise<StockOperationResponseHttpDto> {
    const result = await this.processStockExchangeUseCase.execute({
      memberId: id,
      meetingId: dto.meeting_id,
      fromSubscriptionId: dto.from_subscription_id,
      fromQuantity: dto.from_quantity,
      toStockId: dto.to_stock_id,
      toQuantity: dto.to_quantity,
      differenceHandling: dto.difference_handling,
      targetLoanId: dto.target_loan_id,
      notes: dto.notes,
    });
    return this.mapStockOperationResponseToHttp(result);
  }

  @Get(':id/exchange')
  @ApiOperation({
    summary: 'Obtener intercambios de acciones de un socio',
    description:
      'Retorna todos los intercambios de acciones realizados por un socio, con filtrado opcional por reunión.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del socio',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filtrar por ID de reunión',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de intercambios obtenida correctamente',
    type: [StockExchangeResponseHttpDto],
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Socio no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
  })
  async getStockExchanges(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetMemberStockModificationsQueryHttpDto,
  ): Promise<StockExchangeResponseHttpDto[]> {
    const queryDto: { meetingId?: string } = query.meeting_id
      ? { meetingId: query.meeting_id }
      : {};
    const exchanges = await this.getMemberStockExchangesQuery.execute(
      id,
      queryDto,
    );
    return exchanges.map((exchange) => this.mapStockExchangeToHttp(exchange));
  }

  @Post(':id/transfer')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Transferir acciones a otro socio',
    description:
      'Traslada acciones de una suscripción existente hacia otro socio, ajustando ambas suscripciones y registrando los asientos correspondientes.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del socio que cede las acciones',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: StockTransferHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Transferencia registrada correctamente',
    type: StockOperationResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos para la transferencia',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró el socio, la suscripción o la reunión',
  })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async transferStocks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockTransferHttpDto,
  ): Promise<StockOperationResponseHttpDto> {
    const result = await this.processStockTransferUseCase.execute({
      memberId: id,
      meetingId: dto.meeting_id,
      fromSubscriptionId: dto.transfer_subscription_id,
      quantity: dto.transfer_quantity,
      toMemberId: dto.to_member_id,
      notes: dto.notes,
    });
    return this.mapStockOperationResponseToHttp(result);
  }

  @Get(':id/transfer')
  @ApiOperation({
    summary: 'Obtener transferencias de acciones de un socio',
    description:
      'Retorna todas las transferencias de acciones realizadas por un socio (como origen), con filtrado opcional por reunión.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del socio',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filtrar por ID de reunión',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transferencias obtenida correctamente',
    type: [StockTransferResponseHttpDto],
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Socio no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
  })
  async getStockTransfers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetMemberStockModificationsQueryHttpDto,
  ): Promise<StockTransferResponseHttpDto[]> {
    const queryDto: { meetingId?: string } = query.meeting_id
      ? { meetingId: query.meeting_id }
      : {};
    const transfers = await this.getMemberStockTransfersQuery.execute(
      id,
      queryDto,
    );
    return transfers.map((transfer) => this.mapStockTransferToHttp(transfer));
  }

  @Post(':id/stock-loan-payment')
  @Roles(MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pagar un crédito usando acciones',
    description:
      'Reduce el saldo de un préstamo aplicando acciones existentes y genera el asiento contable del pago.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del socio que amortiza el crédito',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: StockLoanPaymentHttpDto })
  @ApiResponse({
    status: 201,
    description: 'Pago con acciones registrado',
    type: StockOperationResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos para el pago con acciones',
  })
  @ApiNotFoundResponse({
    description:
      'No se encontró el socio, la suscripción, el préstamo o la reunión',
  })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async payLoanWithStocks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockLoanPaymentHttpDto,
  ): Promise<StockOperationResponseHttpDto> {
    const result = await this.processStockLoanPaymentUseCase.execute({
      memberId: id,
      meetingId: dto.meeting_id,
      subscriptionId: dto.loan_payment_subscription_id,
      quantity: dto.loan_payment_quantity,
      loanId: dto.loan_id,
      notes: dto.notes,
    });
    return this.mapStockOperationResponseToHttp(result);
  }

  @Get(':id/stock-loan-payment')
  @ApiOperation({
    summary: 'Obtener pagos con acciones de un socio',
    description:
      'Retorna todos los pagos de créditos realizados con acciones por un socio, con filtrado opcional por reunión.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del socio',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filtrar por ID de reunión',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos con acciones obtenida correctamente',
    type: [StockLoanPaymentResponseHttpDto],
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Socio no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
  })
  async getStockLoanPayments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetMemberStockModificationsQueryHttpDto,
  ): Promise<StockLoanPaymentResponseHttpDto[]> {
    const queryDto: { meetingId?: string } = query.meeting_id
      ? { meetingId: query.meeting_id }
      : {};
    const payments = await this.getMemberStockLoanPaymentsQuery.execute(
      id,
      queryDto,
    );
    return payments.map((payment) => this.mapStockLoanPaymentToHttp(payment));
  }

  @Get(':id/payment-schedule')
  @ApiOperation({
    summary: 'Get member payment schedule',
    description:
      'Retrieves complete payment schedule for a member including historical and projected payments. Supports optional filtering by number of months to project.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to project forward',
    type: Number,
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment schedule retrieved successfully',
    type: PaymentScheduleResponseHttpDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or invalid query parameters',
  })
  @ApiNotFoundResponse({
    description: 'Member not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getPaymentSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetPaymentScheduleQueryHttpDto,
  ): Promise<PaymentScheduleResponseHttpDto> {
    const schedule = await this.getMemberPaymentScheduleQuery.execute(id, {
      months: query.months,
    });
    return this.mapPaymentScheduleToHttp(schedule);
  }

  private mapStockOperationResponseToHttp(
    response: StockOperationResponseDto,
  ): StockOperationResponseHttpDto {
    return {
      operation_id: response.operationId,
      message: response.message,
      details: response.details,
    };
  }

  private mapRecordMonthlyPaymentsToHttp(
    r: RecordMonthlyPaymentsResponseDto,
  ): RecordMonthlyPaymentsResponseHttpDto {
    return {
      operation_id: r.operationId,
      meeting_id: r.meetingId,
      member_id: r.memberId,
      total_amount: r.totalAmount,
      ledger_entry_ids: r.ledgerEntryIds,
    };
  }

  private mapPurchaseStockToHttp(
    r: PurchaseStockResponseDto,
  ): PurchaseStockResponseHttpDto {
    return {
      operation_id: r.operationId,
      meeting_id: r.meetingId,
      member_id: r.memberId,
      stock_subscription_id: r.stockSubscriptionId,
      loan_id: r.loanId ?? null,
    };
  }

  private mapPurchaseToHttp(
    purchase: MemberPurchaseResponseDto,
  ): MemberPurchaseResponseHttpDto {
    return {
      stock_subscription_id: purchase.stockSubscriptionId,
      stock_id: purchase.stockId,
      stock_type: purchase.stockType,
      quantity: purchase.quantity,
      unit_value: purchase.unitValue,
      total_value: purchase.totalValue,
      purchase_date: purchase.purchaseDate,
      meeting_id: purchase.meetingId,
      operation_id: purchase.operationId,
      loan: purchase.loan
        ? {
            loan_id: purchase.loan.loanId,
            approved_amount: purchase.loan.approvedAmount,
            interest_rate: purchase.loan.interestRate,
            status: purchase.loan.status,
          }
        : null,
    };
  }

  private mapPaymentToHttp(
    payment: MemberPaymentResponseDto,
  ): MemberPaymentResponseHttpDto {
    return {
      operation_id: payment.operationId,
      type: String(payment.type),
      total_amount: payment.totalAmount,
      description: payment.description,
      date: payment.date,
      meeting_id: payment.meetingId,
      entries: payment.entries.map((entry) => ({
        id: entry.id,
        account_type: entry.accountType,
        amount: entry.amount,
        description: entry.description,
        loan_id: entry.loanId,
        stock_id: entry.stockId,
        mandatory_contribution_id: entry.mandatoryContributionId,
        stock_subscription_id: entry.stockSubscriptionId,
      })),
    };
  }

  private mapMemberToHttp(m: MemberResponseDto): MemberResponseHttpDto {
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      identification_number: m.identificationNumber,
      status: m.status,
      address: m.address,
      phone: m.phone,
      beneficiary: m.beneficiary,
      registration_date: m.registrationDate,
      created_at: m.createdAt,
    };
  }

  private mapStockExchangeToHttp(
    exchange: StockExchangeResponseDto,
  ): StockExchangeResponseHttpDto {
    return {
      operation_id: exchange.operationId,
      meeting_id: exchange.meetingId,
      date: exchange.date,
      description: exchange.description,
      from_stock_id: exchange.fromStockId,
      from_stock_type: exchange.fromStockType,
      from_quantity: exchange.fromQuantity,
      from_value: exchange.fromValue,
      to_stock_id: exchange.toStockId,
      to_stock_type: exchange.toStockType,
      to_quantity: exchange.toQuantity,
      to_value: exchange.toValue,
      difference: exchange.difference,
      difference_handling: exchange.differenceHandling,
      from_subscription_id: exchange.fromSubscriptionId,
      to_subscription_id: exchange.toSubscriptionId,
      pending_payment_id: exchange.pendingPaymentId,
      loan_id: exchange.loanId,
    };
  }

  private mapStockTransferToHttp(
    transfer: StockTransferResponseDto,
  ): StockTransferResponseHttpDto {
    return {
      operation_id: transfer.operationId,
      meeting_id: transfer.meetingId,
      date: transfer.date,
      description: transfer.description,
      stock_id: transfer.stockId,
      stock_type: transfer.stockType,
      quantity: transfer.quantity,
      value: transfer.value,
      from_member_id: transfer.fromMemberId,
      from_member_name: transfer.fromMemberName,
      to_member_id: transfer.toMemberId,
      to_member_name: transfer.toMemberName,
      from_subscription_id: transfer.fromSubscriptionId,
      to_subscription_id: transfer.toSubscriptionId,
    };
  }

  private mapStockLoanPaymentToHttp(
    payment: StockLoanPaymentResponseDto,
  ): StockLoanPaymentResponseHttpDto {
    return {
      operation_id: payment.operationId,
      meeting_id: payment.meetingId,
      date: payment.date,
      description: payment.description,
      stock_id: payment.stockId,
      stock_type: payment.stockType,
      quantity: payment.quantity,
      payment_value: payment.paymentValue,
      loan_id: payment.loanId,
      loan_type: payment.loanType,
      previous_balance: payment.previousBalance,
      new_balance: payment.newBalance,
      subscription_id: payment.subscriptionId,
      transaction_detail_id: payment.transactionDetailId,
    };
  }

  private mapPaymentScheduleToHttp(
    schedule: PaymentScheduleResponseDto,
  ): PaymentScheduleResponseHttpDto {
    return {
      member_id: schedule.memberId,
      historical_payments: schedule.historicalPayments.map((item) => ({
        date: item.date,
        type: item.type,
        loan_id: item.loanId,
        loan_type: item.loanType,
        total_amount: item.totalAmount,
        interest_amount: item.interestAmount,
        principal_amount: item.principalAmount,
        status: item.status,
        operation_id: item.operationId,
        remaining_balance: item.remainingBalance,
        payment_number: item.paymentNumber,
      })),
      projected_payments: schedule.projectedPayments.map((item) => ({
        date: item.date,
        type: item.type,
        loan_id: item.loanId,
        loan_type: item.loanType,
        total_amount: item.totalAmount,
        interest_amount: item.interestAmount,
        principal_amount: item.principalAmount,
        status: item.status,
        operation_id: item.operationId,
        remaining_balance: item.remainingBalance,
        payment_number: item.paymentNumber,
      })),
      summary: {
        total_paid: schedule.summary.totalPaid,
        total_pending: schedule.summary.totalPending,
        next_payment_date: schedule.summary.nextPaymentDate,
        next_payment_amount: schedule.summary.nextPaymentAmount,
        total_outstanding_balance: schedule.summary.totalOutstandingBalance,
      },
    };
  }

  private mapStockSubscriptionToHttp(
    subscription: StockSubscriptionResponseDto,
  ): StockSubscriptionResponseHttpDto {
    return {
      id: subscription.id,
      stock_id: subscription.stockId,
      stock_type: subscription.stockType,
      quantity: subscription.quantity,
      purchase_date: subscription.purchaseDate,
      status: subscription.status,
      financing_loan_id: subscription.financingLoanId || null,
    };
  }

  private mapLoanToHttp(loan: LoanResponseDto): LoanResponseHttpDto {
    return {
      id: loan.id,
      member_id: loan.memberId,
      loan_type: loan.loanType,
      approved_amount: loan.approvedAmount,
      disbursed_amount: loan.disbursedAmount,
      outstanding_balance: loan.outstandingBalance,
      monthly_payment_amount: loan.monthlyPaymentAmount,
      interest_rate: loan.interestRate,
      term: loan.term,
      status: loan.status,
      creation_date: loan.creationDate,
      guaranteed_stock_id: loan.guaranteedStockId,
    };
  }
}
