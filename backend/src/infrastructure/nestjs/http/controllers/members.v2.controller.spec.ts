import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MembersV2Controller } from './members.v2.controller';
import { GetMembersQueryHandler } from '@application/queries/members/get-members.query-handler';
import { GetMemberDetailQueryHandler } from '@application/queries/members/get-member-detail.query-handler';
import { GetMemberDuesForActiveMeetingQueryHandler } from '@application/queries/members/get-member-dues-for-active-meeting.query-handler';
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

describe('MembersV2Controller', () => {
  let controller: MembersV2Controller;
  let getMembersQuery: jest.Mocked<GetMembersQueryHandler>;
  let getMemberDetailQuery: jest.Mocked<GetMemberDetailQueryHandler>;
  let createMemberUseCase: jest.Mocked<CreateMemberUseCase>;
  let updateMemberUseCase: jest.Mocked<UpdateMemberUseCase>;
  let deleteMemberUseCase: jest.Mocked<DeleteMemberUseCase>;
  let recordMonthlyPaymentsUseCase: jest.Mocked<RecordMonthlyPaymentsUseCase>;

  // Spies for execute methods to avoid 'this' scoping issues
  let getMembersQueryExecuteSpy: jest.SpyInstance;
  let getMemberDetailQueryExecuteSpy: jest.SpyInstance;
  let createMemberUseCaseExecuteSpy: jest.SpyInstance;
  let updateMemberUseCaseExecuteSpy: jest.SpyInstance;
  let deleteMemberUseCaseExecuteSpy: jest.SpyInstance;
  let recordMonthlyPaymentsUseCaseExecuteSpy: jest.SpyInstance;

  const mockMemberResponse: MemberResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Member',
    email: 'test@example.com',
    role: 'member',
    status: 'active',
    registrationDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
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
      ],
    }).compile();

    controller = module.get<MembersV2Controller>(MembersV2Controller);
    getMembersQuery = module.get(GetMembersQueryHandler);
    getMemberDetailQuery = module.get(GetMemberDetailQueryHandler);
    createMemberUseCase = module.get(CreateMemberUseCase);
    updateMemberUseCase = module.get(UpdateMemberUseCase);
    deleteMemberUseCase = module.get(DeleteMemberUseCase);
    recordMonthlyPaymentsUseCase = module.get(RecordMonthlyPaymentsUseCase);

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
});
