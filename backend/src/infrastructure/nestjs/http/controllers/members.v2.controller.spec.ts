import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MembersV2Controller } from './members.v2.controller';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { GetMemberDuesForActiveMeetingQueryHandler } from '@application/queries/members/get-member-dues-for-active-meeting.query-handler';
import { GetMemberPaymentsQueryHandler } from '@application/queries/members/get-member-payments.query-handler';
import { GetMemberPurchasesQueryHandler } from '@application/queries/members/get-member-purchases.query-handler';
import { GetMemberStockExchangesQueryHandler } from '@application/queries/members/get-member-stock-exchanges.query-handler';
import { GetMemberStockTransfersQueryHandler } from '@application/queries/members/get-member-stock-transfers.query-handler';
import { GetMemberStockLoanPaymentsQueryHandler } from '@application/queries/members/get-member-stock-loan-payments.query-handler';
import { GetMemberPaymentScheduleQueryHandler } from '@application/queries/members/get-member-payment-schedule.query-handler';
import { CreateMemberUseCase } from '@application/use-cases/members/create-member.use-case';
import { UpdateMemberUseCase } from '@application/use-cases/members/update-member.use-case';
import { DeleteMemberUseCase } from '@application/use-cases/members/delete-member.use-case';
import { RecordMonthlyPaymentsUseCase } from '@application/use-cases/members/record-monthly-payments.use-case';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';
import { RecordMonthlyPaymentsResponseDto } from '@application/dto/members/record-monthly-payments-response.dto';
import { PaymentType } from '@application/dto/members/payment-item.dto';
import { RecordMonthlyPaymentsHttpDto } from '../dto/record-monthly-payments-http.dto';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { InvalidRequestError } from '@domain/errors/invalid-request.error';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { CalculateMemberInsuranceUseCase } from '@application/use-cases/members/calculate-member-insurance.use-case';
import { PurchaseStockUseCase } from '@application/use-cases/members/purchase-stock.use-case';
import { PurchaseStockResponseDto } from '@application/dto/members/purchase-stock-response.dto';
import { PurchaseStockHttpDto } from '../dto/purchase-stock-http.dto';
import { StockNotFoundException } from '@application/exceptions/stock-not-found.exception';
import { ProcessStockExchangeUseCase } from '@application/use-cases/members/process-stock-exchange.use-case';
import { ProcessStockTransferUseCase } from '@application/use-cases/members/process-stock-transfer.use-case';
import { ProcessStockLoanPaymentUseCase } from '@application/use-cases/members/process-stock-loan-payment.use-case';
import { StockOperationResponseDto } from '@application/dto/members/stock-operation-response.dto';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';

describe('MembersV2Controller', () => {
  let controller: MembersV2Controller;
  let getMembersQuery: jest.Mocked<GetMembersQueryHandler>;
  let getMemberDetailQuery: jest.Mocked<GetMemberDetailQueryHandler>;
  let createMemberUseCase: jest.Mocked<CreateMemberUseCase>;
  let updateMemberUseCase: jest.Mocked<UpdateMemberUseCase>;
  let deleteMemberUseCase: jest.Mocked<DeleteMemberUseCase>;
  let recordMonthlyPaymentsUseCase: jest.Mocked<RecordMonthlyPaymentsUseCase>;
  let calculateMemberInsuranceUseCase: jest.Mocked<CalculateMemberInsuranceUseCase>;
  let purchaseStockUseCase: jest.Mocked<PurchaseStockUseCase>;
  let getMemberPurchasesQuery: jest.Mocked<GetMemberPurchasesQueryHandler>;
  let getMemberStockExchangesQuery: jest.Mocked<GetMemberStockExchangesQueryHandler>;
  let getMemberStockTransfersQuery: jest.Mocked<GetMemberStockTransfersQueryHandler>;
  let getMemberStockLoanPaymentsQuery: jest.Mocked<GetMemberStockLoanPaymentsQueryHandler>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let getMemberPaymentScheduleQuery: jest.Mocked<GetMemberPaymentScheduleQueryHandler>;
  let processStockExchangeUseCase: jest.Mocked<ProcessStockExchangeUseCase>;
  let processStockTransferUseCase: jest.Mocked<ProcessStockTransferUseCase>;
  let processStockLoanPaymentUseCase: jest.Mocked<ProcessStockLoanPaymentUseCase>;

  // Spies for execute methods to avoid 'this' scoping issues
  let getMembersQueryExecuteSpy: jest.SpyInstance;
  let getMemberDetailQueryExecuteSpy: jest.SpyInstance;
  let getMemberStockExchangesQueryExecuteSpy: jest.SpyInstance;
  let getMemberStockTransfersQueryExecuteSpy: jest.SpyInstance;
  let getMemberStockLoanPaymentsQueryExecuteSpy: jest.SpyInstance;
  let createMemberUseCaseExecuteSpy: jest.SpyInstance;
  let updateMemberUseCaseExecuteSpy: jest.SpyInstance;
  let deleteMemberUseCaseExecuteSpy: jest.SpyInstance;
  let recordMonthlyPaymentsUseCaseExecuteSpy: jest.SpyInstance;
  let calculateMemberInsuranceUseCaseExecuteSpy: jest.SpyInstance;
  let purchaseStockUseCaseExecuteSpy: jest.SpyInstance;
  let getMemberPurchasesQueryExecuteSpy: jest.SpyInstance;
  let processStockExchangeUseCaseExecuteSpy: jest.SpyInstance;
  let processStockTransferUseCaseExecuteSpy: jest.SpyInstance;
  let processStockLoanPaymentUseCaseExecuteSpy: jest.SpyInstance;

  const mockMemberResponse: MemberResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Member',
    email: 'test@example.com',
    role: 'member',
    status: 'active',
    registrationDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
  };
  const mockStockOperationResponse: StockOperationResponseDto = {
    operationId: 'operation-123',
    message: 'ok',
    details: { foo: 'bar' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersV2Controller],
      providers: [
        {
          provide: GetMembersQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberDetailQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberDuesForActiveMeetingQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberPaymentsQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberPurchasesQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberStockExchangesQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberStockTransfersQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberStockLoanPaymentsQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMemberPaymentScheduleQueryHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CreateMemberUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateMemberUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteMemberUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RecordMonthlyPaymentsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CalculateMemberInsuranceUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: PurchaseStockUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ProcessStockExchangeUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ProcessStockTransferUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ProcessStockLoanPaymentUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MembersV2Controller>(MembersV2Controller);
    getMembersQuery = module.get(GetMembersQueryHandler);
    getMemberDetailQuery = module.get(GetMemberDetailQueryHandler);
    createMemberUseCase = module.get(CreateMemberUseCase);
    updateMemberUseCase = module.get(UpdateMemberUseCase);
    deleteMemberUseCase = module.get(DeleteMemberUseCase);
    recordMonthlyPaymentsUseCase = module.get(RecordMonthlyPaymentsUseCase);
    calculateMemberInsuranceUseCase = module.get(
      CalculateMemberInsuranceUseCase,
    );
    purchaseStockUseCase = module.get(PurchaseStockUseCase);
    getMemberPurchasesQuery = module.get(GetMemberPurchasesQueryHandler);
    getMemberStockExchangesQuery = module.get(
      GetMemberStockExchangesQueryHandler,
    );
    getMemberStockTransfersQuery = module.get(
      GetMemberStockTransfersQueryHandler,
    );
    getMemberStockLoanPaymentsQuery = module.get(
      GetMemberStockLoanPaymentsQueryHandler,
    );
    getMemberPaymentScheduleQuery = module.get(
      GetMemberPaymentScheduleQueryHandler,
    );
    processStockExchangeUseCase = module.get(ProcessStockExchangeUseCase);
    processStockTransferUseCase = module.get(ProcessStockTransferUseCase);
    processStockLoanPaymentUseCase = module.get(ProcessStockLoanPaymentUseCase);

    // Create spies to avoid 'this' scoping issues
    getMembersQueryExecuteSpy = jest.spyOn(getMembersQuery, 'execute');
    getMemberDetailQueryExecuteSpy = jest.spyOn(
      getMemberDetailQuery,
      'execute',
    );
    createMemberUseCaseExecuteSpy = jest.spyOn(createMemberUseCase, 'execute');
    updateMemberUseCaseExecuteSpy = jest.spyOn(updateMemberUseCase, 'execute');
    deleteMemberUseCaseExecuteSpy = jest.spyOn(deleteMemberUseCase, 'execute');
    recordMonthlyPaymentsUseCaseExecuteSpy = jest.spyOn(
      recordMonthlyPaymentsUseCase,
      'execute',
    );
    calculateMemberInsuranceUseCaseExecuteSpy = jest.spyOn(
      calculateMemberInsuranceUseCase,
      'execute',
    );
    purchaseStockUseCaseExecuteSpy = jest.spyOn(
      purchaseStockUseCase,
      'execute',
    );
    processStockExchangeUseCaseExecuteSpy = jest.spyOn(
      processStockExchangeUseCase,
      'execute',
    );
    processStockTransferUseCaseExecuteSpy = jest.spyOn(
      processStockTransferUseCase,
      'execute',
    );
    processStockLoanPaymentUseCaseExecuteSpy = jest.spyOn(
      processStockLoanPaymentUseCase,
      'execute',
    );
    getMemberPurchasesQueryExecuteSpy = jest.spyOn(
      getMemberPurchasesQuery,
      'execute',
    );
    getMemberStockExchangesQueryExecuteSpy = jest.spyOn(
      getMemberStockExchangesQuery,
      'execute',
    );
    getMemberStockTransfersQueryExecuteSpy = jest.spyOn(
      getMemberStockTransfersQuery,
      'execute',
    );
    getMemberStockLoanPaymentsQueryExecuteSpy = jest.spyOn(
      getMemberStockLoanPaymentsQuery,
      'execute',
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return list of active members', async () => {
      const members: MemberResponseDto[] = [
        mockMemberResponse,
        {
          ...mockMemberResponse,
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Member 2',
          email: 'member2@example.com',
        },
      ];

      getMembersQueryExecuteSpy.mockResolvedValue(members);

      const result = await controller.list();

      expect(getMembersQueryExecuteSpy).toHaveBeenCalledTimes(1);
      // Controller returns snake_case HTTP DTOs
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: members[0].id,
        name: members[0].name,
        email: members[0].email,
        identification_number: members[0].identificationNumber,
        registration_date: members[0].registrationDate,
      });
    });

    it('should return empty array when no members exist', async () => {
      getMembersQueryExecuteSpy.mockResolvedValue([]);

      const result = await controller.list();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('detail', () => {
    it('should return member detail by id', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      getMemberDetailQueryExecuteSpy.mockResolvedValue(mockMemberResponse);

      const result = await controller.detail(memberId);

      expect(getMemberDetailQueryExecuteSpy).toHaveBeenCalledWith(memberId);
      // Controller returns snake_case HTTP DTO
      expect(result).toMatchObject({
        id: mockMemberResponse.id,
        name: mockMemberResponse.name,
        email: mockMemberResponse.email,
        identification_number: mockMemberResponse.identificationNumber,
        registration_date: mockMemberResponse.registrationDate,
      });
    });

    it('should throw HttpException with NOT_FOUND when member not found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      getMemberDetailQueryExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(controller.detail(memberId)).rejects.toThrow(HttpException);
      await expect(controller.detail(memberId)).rejects.toThrow('Not Found');

      const error = (await controller
        .detail(memberId)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should handle non-Error exceptions and return NOT_FOUND', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      getMemberDetailQueryExecuteSpy.mockRejectedValue('String error');

      await expect(controller.detail(memberId)).rejects.toThrow(HttpException);

      const error = (await controller
        .detail(memberId)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('create', () => {
    it('should create member successfully', async () => {
      const createDto = {
        name: 'New Member',
        email: 'new@example.com',
      };

      createMemberUseCaseExecuteSpy.mockResolvedValue(mockMemberResponse);

      const result = await controller.create(createDto);

      expect(createMemberUseCaseExecuteSpy).toHaveBeenCalledWith(createDto);
      // Controller returns snake_case HTTP DTO
      expect(result).toMatchObject({
        id: mockMemberResponse.id,
        name: mockMemberResponse.name,
        email: mockMemberResponse.email,
        identification_number: mockMemberResponse.identificationNumber,
        registration_date: mockMemberResponse.registrationDate,
      });
    });

    it('should throw HttpException with BAD_REQUEST when creation fails', async () => {
      const createDto = {
        name: 'New Member',
        email: 'invalid-email',
      };

      createMemberUseCaseExecuteSpy.mockRejectedValue(
        new InvalidRequestError('Invalid email format'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
      await expect(controller.create(createDto)).rejects.toThrow(
        'Invalid email format',
      );

      const error = (await controller
        .create(createDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should handle non-Error exceptions and return INTERNAL_SERVER_ERROR', async () => {
      const createDto = {
        name: 'New Member',
        email: 'new@example.com',
      };

      createMemberUseCaseExecuteSpy.mockRejectedValue('String error');

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
      await expect(controller.create(createDto)).rejects.toThrow(
        'Internal server error',
      );

      const error = (await controller
        .create(createDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('update', () => {
    it('should update member successfully', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = {
        name: 'Updated Name',
      };

      const updatedMember: MemberResponseDto = {
        ...mockMemberResponse,
        name: 'Updated Name',
      };

      updateMemberUseCaseExecuteSpy.mockResolvedValue(updatedMember);

      const result = await controller.update(memberId, updateDto);

      expect(updateMemberUseCaseExecuteSpy).toHaveBeenCalledWith({
        ...updateDto,
        memberId,
      });
      // Controller returns snake_case HTTP DTO
      expect(result).toMatchObject({
        id: updatedMember.id,
        name: 'Updated Name',
        email: updatedMember.email,
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw HttpException with NOT_FOUND when member not found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = {
        name: 'Updated Name',
      };

      updateMemberUseCaseExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(controller.update(memberId, updateDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update(memberId, updateDto)).rejects.toThrow(
        'Not Found',
      );

      const error = (await controller
        .update(memberId, updateDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should handle non-Error exceptions and return NOT_FOUND', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = {
        name: 'Updated Name',
      };

      updateMemberUseCaseExecuteSpy.mockRejectedValue('String error');

      await expect(controller.update(memberId, updateDto)).rejects.toThrow(
        HttpException,
      );

      const error = (await controller
        .update(memberId, updateDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should pass memberId from param to use case', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = {
        name: 'Updated',
        email: 'updated@example.com',
      };

      updateMemberUseCaseExecuteSpy.mockResolvedValue(mockMemberResponse);

      await controller.update(memberId, updateDto);

      expect(updateMemberUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        name: 'Updated',
        email: 'updated@example.com',
      });
    });
  });

  describe('remove', () => {
    it('should delete member successfully', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      deleteMemberUseCaseExecuteSpy.mockResolvedValue(undefined);

      await controller.remove(memberId);

      expect(deleteMemberUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
      });
    });

    it('should throw HttpException with NOT_FOUND when member not found', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      deleteMemberUseCaseExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(controller.remove(memberId)).rejects.toThrow(HttpException);
      await expect(controller.remove(memberId)).rejects.toThrow('Not Found');

      const error = (await controller
        .remove(memberId)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should handle non-Error exceptions and return NOT_FOUND', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440000';
      deleteMemberUseCaseExecuteSpy.mockRejectedValue('String error');

      await expect(controller.remove(memberId)).rejects.toThrow(HttpException);

      const error = (await controller
        .remove(memberId)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('recordMonthlyPayments', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const mockResponse: RecordMonthlyPaymentsResponseDto = {
      operationId: '650e8400-e29b-41d4-a716-446655440000',
      meetingId: '750e8400-e29b-41d4-a716-446655440000',
      memberId,
      totalAmount: 150.0,
      ledgerEntryIds: [
        '850e8400-e29b-41d4-a716-446655440000',
        '950e8400-e29b-41d4-a716-446655440000',
      ],
    };

    const validDto: RecordMonthlyPaymentsHttpDto = {
      payments: [
        {
          type: PaymentType.STOCK_FEE,
          amount: 100.0,
          description: 'Stock fee payment',
        },
        {
          type: PaymentType.MANDATORY_CONTRIBUTION,
          amount: 50.0,
          description: 'Mandatory contribution',
        },
      ],
    };

    it('should record monthly payments successfully', async () => {
      recordMonthlyPaymentsUseCaseExecuteSpy.mockResolvedValue(mockResponse);

      const result = await controller.recordMonthlyPayments(memberId, validDto);

      expect(recordMonthlyPaymentsUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        payments: validDto.payments,
        meetingId: undefined,
      });
      // Controller returns snake_case HTTP DTO
      expect(result).toMatchObject({
        operation_id: mockResponse.operationId,
        meeting_id: mockResponse.meetingId,
        member_id: mockResponse.memberId,
        total_amount: mockResponse.totalAmount,
        ledger_entry_ids: mockResponse.ledgerEntryIds,
      });
    });

    it('should record monthly payments with meetingId', async () => {
      const dtoWithMeeting = {
        ...validDto,
        meetingId: '750e8400-e29b-41d4-a716-446655440000',
      };
      recordMonthlyPaymentsUseCaseExecuteSpy.mockResolvedValue(mockResponse);

      const result = await controller.recordMonthlyPayments(
        memberId,
        dtoWithMeeting,
      );

      expect(recordMonthlyPaymentsUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        payments: validDto.payments,
        meetingId: dtoWithMeeting.meetingId,
      });
      // Controller returns snake_case HTTP DTO
      expect(result).toMatchObject({
        operation_id: mockResponse.operationId,
        meeting_id: mockResponse.meetingId,
        member_id: mockResponse.memberId,
        total_amount: mockResponse.totalAmount,
        ledger_entry_ids: mockResponse.ledgerEntryIds,
      });
    });

    it('should throw HttpException when member not found', async () => {
      recordMonthlyPaymentsUseCaseExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(
        controller.recordMonthlyPayments(memberId, validDto),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when meeting not found', async () => {
      recordMonthlyPaymentsUseCaseExecuteSpy.mockRejectedValue(
        new MeetingNotFoundException('meeting-id'),
      );

      await expect(
        controller.recordMonthlyPayments(memberId, validDto),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException with INTERNAL_SERVER_ERROR for unknown errors', async () => {
      recordMonthlyPaymentsUseCaseExecuteSpy.mockRejectedValue('String error');

      await expect(
        controller.recordMonthlyPayments(memberId, validDto),
      ).rejects.toThrow(HttpException);

      const error = (await controller
        .recordMonthlyPayments(memberId, validDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('calculateInsurance', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';

    it('should calculate insurance without capital payment', async () => {
      calculateMemberInsuranceUseCaseExecuteSpy.mockResolvedValue({
        insuranceAmount: 1234,
      });

      const result = await controller.calculateInsurance(memberId);

      expect(calculateMemberInsuranceUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        capitalPayment: undefined,
      });
      expect(result).toEqual({ insurance_amount: 1234 });
    });

    it('should forward capital payment to the use case', async () => {
      calculateMemberInsuranceUseCaseExecuteSpy.mockResolvedValue({
        insuranceAmount: 5678,
      });

      const capitalPayment = 100000;
      const result = await controller.calculateInsurance(
        memberId,
        capitalPayment,
      );

      expect(calculateMemberInsuranceUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        capitalPayment,
      });
      expect(result).toEqual({ insurance_amount: 5678 });
    });
  });

  describe('POST /v2/members/:id/purchase', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const mockPurchaseResponse: PurchaseStockResponseDto = {
      operationId: 'operation-id-1',
      meetingId: 'meeting-id-1',
      memberId: memberId,
      stockSubscriptionId: 'subscription-id-1',
      loanId: null,
    };

    it('should successfully purchase stocks with cash payment', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'stock-id-1',
        quantity: 2,
        cash_amount: 200000,
      };

      purchaseStockUseCaseExecuteSpy.mockResolvedValue(mockPurchaseResponse);

      const result = await controller.purchaseStock(memberId, dto);

      expect(result).toEqual({
        operation_id: 'operation-id-1',
        meeting_id: 'meeting-id-1',
        member_id: memberId,
        stock_subscription_id: 'subscription-id-1',
        loan_id: null,
      });

      expect(purchaseStockUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId: memberId,
        stockId: dto.stock_id,
        quantity: dto.quantity,
        cashAmount: dto.cash_amount,
        loanDetails: undefined,
        meetingId: undefined,
      });
    });

    it('should successfully purchase stocks with loan financing', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'stock-id-1',
        quantity: 2,
        cash_amount: 0,
        loan_details: {
          interest_rate: 0.02,
          loan_type: 'accion',
        },
      };

      const responseWithLoan: PurchaseStockResponseDto = {
        ...mockPurchaseResponse,
        loanId: 'loan-id-1',
      };

      purchaseStockUseCaseExecuteSpy.mockResolvedValue(responseWithLoan);

      const result = await controller.purchaseStock(memberId, dto);

      expect(result).toEqual({
        operation_id: 'operation-id-1',
        meeting_id: 'meeting-id-1',
        member_id: memberId,
        stock_subscription_id: 'subscription-id-1',
        loan_id: 'loan-id-1',
      });

      expect(purchaseStockUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId: memberId,
        stockId: dto.stock_id,
        quantity: dto.quantity,
        cashAmount: dto.cash_amount,
        loanDetails: {
          interest_rate: dto.loan_details!.interest_rate,
          loan_type: dto.loan_details!.loan_type,
        },
        meetingId: undefined,
      });
    });

    it('should successfully purchase stocks with partial payment and loan', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'stock-id-1',
        quantity: 2,
        cash_amount: 100000,
        loan_details: {
          interest_rate: 0.02,
          loan_type: 'accion',
        },
        meeting_id: 'meeting-id-1',
      };

      const responseWithLoan: PurchaseStockResponseDto = {
        ...mockPurchaseResponse,
        loanId: 'loan-id-1',
        meetingId: 'meeting-id-1',
      };

      purchaseStockUseCaseExecuteSpy.mockResolvedValue(responseWithLoan);

      const result = await controller.purchaseStock(memberId, dto);

      expect(result).toEqual({
        operation_id: 'operation-id-1',
        meeting_id: 'meeting-id-1',
        member_id: memberId,
        stock_subscription_id: 'subscription-id-1',
        loan_id: 'loan-id-1',
      });

      expect(purchaseStockUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId: memberId,
        stockId: dto.stock_id,
        quantity: dto.quantity,
        cashAmount: dto.cash_amount,
        loanDetails: {
          interest_rate: dto.loan_details!.interest_rate,
          loan_type: dto.loan_details!.loan_type,
        },
        meetingId: dto.meeting_id,
      });
    });

    it('should return 404 when member is not found', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'stock-id-1',
        quantity: 1,
        cash_amount: 100000,
      };

      purchaseStockUseCaseExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(controller.purchaseStock(memberId, dto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should return 404 when stock is not found', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'non-existent-stock',
        quantity: 1,
        cash_amount: 100000,
      };

      purchaseStockUseCaseExecuteSpy.mockRejectedValue(
        new StockNotFoundException('non-existent-stock'),
      );

      await expect(controller.purchaseStock(memberId, dto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should return 404 when meeting is not found', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'stock-id-1',
        quantity: 1,
        cash_amount: 100000,
        meeting_id: 'non-existent-meeting',
      };

      purchaseStockUseCaseExecuteSpy.mockRejectedValue(
        new MeetingNotFoundException('non-existent-meeting'),
      );

      await expect(controller.purchaseStock(memberId, dto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should return 400 when validation fails', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'stock-id-1',
        quantity: 0, // Invalid quantity
        cash_amount: 100000,
      };

      purchaseStockUseCaseExecuteSpy.mockRejectedValue(
        new InvalidRequestError('Quantity must be greater than zero'),
      );

      await expect(controller.purchaseStock(memberId, dto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should return 500 when an unexpected error occurs', async () => {
      const dto: PurchaseStockHttpDto = {
        stock_id: 'stock-id-1',
        quantity: 1,
        cash_amount: 100000,
      };

      purchaseStockUseCaseExecuteSpy.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(controller.purchaseStock(memberId, dto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('POST /v2/members/:id/purchase/exchange', () => {
    const memberId = 'member-id-1';
    const exchangeDto = {
      meeting_id: 'meeting-id-1',
      from_subscription_id: 'from-subscription-id',
      from_quantity: 2,
      to_stock_id: 'stock-id-1',
      to_quantity: 1,
      difference_handling: 'cash' as const,
    };

    it('regresa la respuesta en snake_case', async () => {
      processStockExchangeUseCaseExecuteSpy.mockResolvedValue(
        mockStockOperationResponse,
      );

      const result = await controller.exchangeStocks(memberId, exchangeDto);

      expect(result).toEqual({
        operation_id: mockStockOperationResponse.operationId,
        message: mockStockOperationResponse.message,
        details: mockStockOperationResponse.details,
      });
      expect(processStockExchangeUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        meetingId: exchangeDto.meeting_id,
        fromSubscriptionId: exchangeDto.from_subscription_id,
        fromQuantity: exchangeDto.from_quantity,
        toStockId: exchangeDto.to_stock_id,
        toQuantity: exchangeDto.to_quantity,
        differenceHandling: exchangeDto.difference_handling,
        targetLoanId: undefined,
        notes: undefined,
      });
    });

    it('lanza HttpException 404 cuando no se encuentra el socio', async () => {
      processStockExchangeUseCaseExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(
        controller.exchangeStocks(memberId, exchangeDto),
      ).rejects.toBeInstanceOf(HttpException);

      const error = (await controller
        .exchangeStocks(memberId, exchangeDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /v2/members/:id/purchase/transfer', () => {
    const memberId = 'member-id-1';
    const transferDto = {
      meeting_id: 'meeting-id-1',
      from_subscription_id: 'from-subscription-id',
      quantity: 1,
      to_member_id: 'member-id-2',
    };

    it('procesa la transferencia correctamente', async () => {
      processStockTransferUseCaseExecuteSpy.mockResolvedValue(
        mockStockOperationResponse,
      );

      const result = await controller.transferStocks(memberId, transferDto);

      expect(result.operation_id).toBe(mockStockOperationResponse.operationId);
      expect(processStockTransferUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        meetingId: transferDto.meeting_id,
        fromSubscriptionId: transferDto.from_subscription_id,
        quantity: transferDto.quantity,
        toMemberId: transferDto.to_member_id,
        notes: undefined,
      });
    });

    it('devuelve 400 cuando la lógica de negocio falla', async () => {
      processStockTransferUseCaseExecuteSpy.mockRejectedValue(
        new InvalidRequestError('error'),
      );

      await expect(
        controller.transferStocks(memberId, transferDto),
      ).rejects.toBeInstanceOf(HttpException);

      const error = (await controller
        .transferStocks(memberId, transferDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v2/members/:id/purchase/loan-payment', () => {
    const memberId = 'member-id-1';
    const loanPaymentDto = {
      meeting_id: 'meeting-id-1',
      subscription_id: 'subscription-id',
      quantity: 1,
      loan_id: 'loan-id',
    };

    it('registra el pago con acciones', async () => {
      processStockLoanPaymentUseCaseExecuteSpy.mockResolvedValue(
        mockStockOperationResponse,
      );

      const result = await controller.payLoanWithStocks(
        memberId,
        loanPaymentDto,
      );

      expect(result.details).toEqual(mockStockOperationResponse.details);
      expect(processStockLoanPaymentUseCaseExecuteSpy).toHaveBeenCalledWith({
        memberId,
        meetingId: loanPaymentDto.meeting_id,
        subscriptionId: loanPaymentDto.subscription_id,
        quantity: loanPaymentDto.quantity,
        loanId: loanPaymentDto.loan_id,
        notes: undefined,
      });
    });

    it('responde con 404 cuando no se encuentra el préstamo', async () => {
      processStockLoanPaymentUseCaseExecuteSpy.mockRejectedValue(
        new LoanNotFoundException('loan-id'),
      );

      await expect(
        controller.payLoanWithStocks(memberId, loanPaymentDto),
      ).rejects.toBeInstanceOf(HttpException);

      const error = (await controller
        .payLoanWithStocks(memberId, loanPaymentDto)
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('getPurchases', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '750e8400-e29b-41d4-a716-446655440000';
    const mockPurchases = [
      {
        stockSubscriptionId: '880e8400-e29b-41d4-a716-446655440003',
        stockId: '770e8400-e29b-41d4-a716-446655440002',
        stockType: 'Acción A',
        quantity: 2,
        unitValue: 100000,
        totalValue: 200000,
        purchaseDate: new Date('2024-01-15'),
        meetingId,
        operationId: '990e8400-e29b-41d4-a716-446655440004',
        loan: null,
      },
      {
        stockSubscriptionId: 'aa0e8400-e29b-41d4-a716-446655440006',
        stockId: 'bb0e8400-e29b-41d4-a716-446655440007',
        stockType: 'Acción B',
        quantity: 1,
        unitValue: 150000,
        totalValue: 150000,
        purchaseDate: new Date('2024-01-20'),
        meetingId,
        operationId: 'cc0e8400-e29b-41d4-a716-446655440008',
        loan: {
          loanId: 'dd0e8400-e29b-41d4-a716-446655440009',
          approvedAmount: 100000,
          interestRate: 0.02,
          status: 'active',
        },
      },
    ];

    it('should return purchases successfully', async () => {
      getMemberPurchasesQueryExecuteSpy.mockResolvedValue(mockPurchases);

      const result = await controller.getPurchases(memberId, {});

      expect(getMemberPurchasesQueryExecuteSpy).toHaveBeenCalledWith(memberId, {
        meetingId: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        stock_subscription_id: mockPurchases[0].stockSubscriptionId,
        stock_id: mockPurchases[0].stockId,
        stock_type: mockPurchases[0].stockType,
        quantity: mockPurchases[0].quantity,
        unit_value: mockPurchases[0].unitValue,
        total_value: mockPurchases[0].totalValue,
        purchase_date: mockPurchases[0].purchaseDate,
        meeting_id: mockPurchases[0].meetingId,
        operation_id: mockPurchases[0].operationId,
        loan: null,
      });
      expect(result[1].loan).toMatchObject({
        loan_id: mockPurchases[1].loan!.loanId,
        approved_amount: mockPurchases[1].loan!.approvedAmount,
        interest_rate: mockPurchases[1].loan!.interestRate,
        status: mockPurchases[1].loan!.status,
      });
    });

    it('should filter by meetingId when provided', async () => {
      getMemberPurchasesQueryExecuteSpy.mockResolvedValue([mockPurchases[0]]);

      const result = await controller.getPurchases(memberId, {
        meetingId,
      });

      expect(getMemberPurchasesQueryExecuteSpy).toHaveBeenCalledWith(memberId, {
        meetingId,
      });
      expect(result).toHaveLength(1);
    });

    it('should throw HttpException when member not found', async () => {
      getMemberPurchasesQueryExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(controller.getPurchases(memberId, {})).rejects.toThrow(
        HttpException,
      );

      const error = (await controller
        .getPurchases(memberId, {})
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should throw HttpException with INTERNAL_SERVER_ERROR for unknown errors', async () => {
      getMemberPurchasesQueryExecuteSpy.mockRejectedValue('String error');

      await expect(controller.getPurchases(memberId, {})).rejects.toThrow(
        HttpException,
      );

      const error = (await controller
        .getPurchases(memberId, {})
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('GET /v2/members/:id/purchase/exchange', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '750e8400-e29b-41d4-a716-446655440000';
    const mockExchanges = [
      {
        operationId: 'op-exchange-1',
        meetingId,
        date: new Date('2024-01-15'),
        description: 'Intercambio de acciones',
        fromStockId: 'stock-from-1',
        fromStockType: 'Acción Grande',
        fromQuantity: 1,
        fromValue: 1000000,
        toStockId: 'stock-to-1',
        toStockType: 'Acción Super',
        toQuantity: 1,
        toValue: 800000,
        difference: 200000,
        differenceHandling: 'cash' as const,
        fromSubscriptionId: 'sub-from-1',
        toSubscriptionId: 'sub-to-1',
        pendingPaymentId: 'pending-1',
        loanId: null,
      },
    ];

    it('should return list of stock exchanges', async () => {
      getMemberStockExchangesQueryExecuteSpy.mockResolvedValue(mockExchanges);

      const result = await controller.getStockExchanges(memberId, {});

      expect(getMemberStockExchangesQueryExecuteSpy).toHaveBeenCalledWith(
        memberId,
        { meetingId: undefined },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operation_id: mockExchanges[0].operationId,
        meeting_id: mockExchanges[0].meetingId,
        from_stock_type: mockExchanges[0].fromStockType,
        to_stock_type: mockExchanges[0].toStockType,
        difference: mockExchanges[0].difference,
        pending_payment_id: mockExchanges[0].pendingPaymentId,
      });
    });

    it('should filter by meetingId when provided', async () => {
      getMemberStockExchangesQueryExecuteSpy.mockResolvedValue([
        mockExchanges[0],
      ]);

      const result = await controller.getStockExchanges(memberId, {
        meetingId,
      });

      expect(getMemberStockExchangesQueryExecuteSpy).toHaveBeenCalledWith(
        memberId,
        { meetingId },
      );
      expect(result).toHaveLength(1);
    });

    it('should throw HttpException when member not found', async () => {
      getMemberStockExchangesQueryExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(controller.getStockExchanges(memberId, {})).rejects.toThrow(
        HttpException,
      );

      const error = (await controller
        .getStockExchanges(memberId, {})
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /v2/members/:id/purchase/transfer', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '750e8400-e29b-41d4-a716-446655440000';
    const mockTransfers = [
      {
        operationId: 'op-transfer-1',
        meetingId,
        date: new Date('2024-01-15'),
        description: 'Transferencia de acciones',
        stockId: 'stock-1',
        stockType: 'Acción Mediana',
        quantity: 2,
        value: 1000000,
        fromMemberId: memberId,
        fromMemberName: 'Alice',
        toMemberId: 'to-member-1',
        toMemberName: 'Bob',
        fromSubscriptionId: 'sub-from-1',
        toSubscriptionId: 'sub-to-1',
      },
    ];

    it('should return list of stock transfers', async () => {
      getMemberStockTransfersQueryExecuteSpy.mockResolvedValue(mockTransfers);

      const result = await controller.getStockTransfers(memberId, {});

      expect(getMemberStockTransfersQueryExecuteSpy).toHaveBeenCalledWith(
        memberId,
        { meetingId: undefined },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operation_id: mockTransfers[0].operationId,
        meeting_id: mockTransfers[0].meetingId,
        stock_type: mockTransfers[0].stockType,
        from_member_name: mockTransfers[0].fromMemberName,
        to_member_name: mockTransfers[0].toMemberName,
      });
    });

    it('should filter by meetingId when provided', async () => {
      getMemberStockTransfersQueryExecuteSpy.mockResolvedValue([
        mockTransfers[0],
      ]);

      const result = await controller.getStockTransfers(memberId, {
        meetingId,
      });

      expect(getMemberStockTransfersQueryExecuteSpy).toHaveBeenCalledWith(
        memberId,
        { meetingId },
      );
      expect(result).toHaveLength(1);
    });

    it('should throw HttpException when member not found', async () => {
      getMemberStockTransfersQueryExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(controller.getStockTransfers(memberId, {})).rejects.toThrow(
        HttpException,
      );

      const error = (await controller
        .getStockTransfers(memberId, {})
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /v2/members/:id/purchase/loan-payment', () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const meetingId = '750e8400-e29b-41d4-a716-446655440000';
    const mockPayments = [
      {
        operationId: 'op-loan-payment-1',
        meetingId,
        date: new Date('2024-01-15'),
        description: 'Pago de crédito con acciones',
        stockId: 'stock-1',
        stockType: 'Acción Corriente',
        quantity: 2,
        paymentValue: 600000,
        loanId: 'loan-1',
        loanType: 'accion',
        previousBalance: 1000000,
        newBalance: 400000,
        subscriptionId: 'sub-1',
        transactionDetailId: 'transaction-1',
      },
    ];

    it('should return list of stock loan payments', async () => {
      getMemberStockLoanPaymentsQueryExecuteSpy.mockResolvedValue(mockPayments);

      const result = await controller.getStockLoanPayments(memberId, {});

      expect(getMemberStockLoanPaymentsQueryExecuteSpy).toHaveBeenCalledWith(
        memberId,
        { meetingId: undefined },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operation_id: mockPayments[0].operationId,
        meeting_id: mockPayments[0].meetingId,
        stock_type: mockPayments[0].stockType,
        payment_value: mockPayments[0].paymentValue,
        loan_type: mockPayments[0].loanType,
        previous_balance: mockPayments[0].previousBalance,
        new_balance: mockPayments[0].newBalance,
      });
    });

    it('should filter by meetingId when provided', async () => {
      getMemberStockLoanPaymentsQueryExecuteSpy.mockResolvedValue([
        mockPayments[0],
      ]);

      const result = await controller.getStockLoanPayments(memberId, {
        meetingId,
      });

      expect(getMemberStockLoanPaymentsQueryExecuteSpy).toHaveBeenCalledWith(
        memberId,
        { meetingId },
      );
      expect(result).toHaveLength(1);
    });

    it('should throw HttpException when member not found', async () => {
      getMemberStockLoanPaymentsQueryExecuteSpy.mockRejectedValue(
        new MemberNotFoundException(memberId),
      );

      await expect(
        controller.getStockLoanPayments(memberId, {}),
      ).rejects.toThrow(HttpException);

      const error = (await controller
        .getStockLoanPayments(memberId, {})
        .catch((e: unknown) => e)) as HttpException;
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
