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
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  HttpCode,
  Query,
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
import { DeleteMemberUseCase } from '@application/use-cases/members/delete-member.use-case';
import { CreateMemberUseCase } from '@application/use-cases/members/create-member.use-case';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';
import { MemberDueResponseDto } from '@application/dto/members/member-due-response.dto';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { GetMemberDuesForActiveMeetingQueryHandler } from '@application/queries/members/get-member-dues-for-active-meeting.query-handler';
import { GetMemberPaymentsQueryHandler } from '@application/queries/members/get-member-payments.query-handler';
import { GetMemberPurchasesQueryHandler } from '@application/queries/members/get-member-purchases.query-handler';
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
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';

@ApiTags('Members V2')
@Controller('v2/members')
export class MembersV2Controller {
  constructor(
    private readonly getMembersQuery: GetMembersQueryHandler,
    private readonly getMemberDetailQuery: GetMemberDetailQueryHandler,
    private readonly getMemberDuesQuery: GetMemberDuesForActiveMeetingQueryHandler,
    private readonly getMemberPaymentsQuery: GetMemberPaymentsQueryHandler,
    private readonly getMemberPurchasesQuery: GetMemberPurchasesQueryHandler,
    private readonly createMemberUseCase: CreateMemberUseCase,
    private readonly updateMemberUseCase: UpdateMemberUseCase,
    private readonly deleteMemberUseCase: DeleteMemberUseCase,
    private readonly recordMonthlyPaymentsUseCase: RecordMonthlyPaymentsUseCase,
    private readonly calculateMemberInsuranceUseCase: CalculateMemberInsuranceUseCase,
    private readonly purchaseStockUseCase: PurchaseStockUseCase,
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
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Body() body: CreateMemberHttpDto,
  ): Promise<MemberResponseHttpDto> {
    try {
      const result = await this.createMemberUseCase.execute(body);
      return this.mapMemberToHttp(result);
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
    try {
      const result = await this.getMemberDetailQuery.execute(id);
      return this.mapMemberToHttp(result);
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
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMemberHttpDto,
  ): Promise<MemberResponseHttpDto> {
    try {
      const result = await this.updateMemberUseCase.execute({
        ...body,
        memberId: id,
      });
      return this.mapMemberToHttp(result);
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
    status: 204,
    description: 'Member deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Member not found or already deleted',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.deleteMemberUseCase.execute({ memberId: id });
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
    description: 'Member not found or no active meeting exists',
  })
  async getDues(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MemberDueResponseHttpDto[]> {
    try {
      const dues = await this.getMemberDuesQuery.execute(id);
      return dues.map((d) => this.mapDueToHttp(d));
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error(String(e));
      }
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
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
    } as MemberDueResponseHttpDto;
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
    const payments = await this.getMemberPaymentsQuery.execute(id, {
      paymentType: query.type,
      meetingId: query.meetingId,
    });
    return payments.map((payment) => this.mapPaymentToHttp(payment));
  }

  @Get(':id/purchases')
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
    name: 'meetingId',
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
    try {
      const purchases = await this.getMemberPurchasesQuery.execute(id, {
        meetingId: query.meetingId,
      });
      return purchases.map((purchase) => this.mapPurchaseToHttp(purchase));
    } catch (e: unknown) {
      if (e instanceof MemberNotFoundException) {
        throw new HttpException(e.message, HttpStatus.NOT_FOUND);
      }
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        e instanceof Error ? e.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
        insuranceAmount: {
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
  ): Promise<{ insuranceAmount: number }> {
    const result = await this.calculateMemberInsuranceUseCase.execute({
      memberId: id,
      capitalPayment,
    });
    return { insuranceAmount: result.insuranceAmount };
  }

  @Post(':id/payments')
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
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async recordMonthlyPayments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordMonthlyPaymentsHttpDto,
  ): Promise<RecordMonthlyPaymentsResponseHttpDto> {
    try {
      const result = await this.recordMonthlyPaymentsUseCase.execute({
        memberId: id,
        payments: dto.payments,
        meetingId: dto.meetingId,
      });
      return this.mapRecordMonthlyPaymentsToHttp(result);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/purchase')
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
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async purchaseStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PurchaseStockHttpDto,
  ): Promise<PurchaseStockResponseHttpDto> {
    try {
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
    } catch (error: unknown) {
      if (error instanceof MemberNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof StockNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof MeetingNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    } as RecordMonthlyPaymentsResponseHttpDto;
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
}
