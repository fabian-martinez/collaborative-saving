/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Reflector } from '@nestjs/core';
import { PendingPaymentsController } from './pending-payments.controller';
import { GetPendingPaymentsQueryHandler } from '@application/queries/pending-payments/get-pending-payments.query-handler';
import { UpdatePendingPaymentUseCase } from '@application/use-cases/pending-payments/update-pending-payment.use-case';
import { DeletePendingPaymentUseCase } from '@application/use-cases/pending-payments/delete-pending-payment.use-case';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { MemberRole } from '@domain/enums/member-role.enum';
import {
  PendingMemberPaymentStatus,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';
import { PendingMemberPaymentResponseDto } from '@application/dto/pending-payments/pending-member-payment-response.dto';

describe('PendingPaymentsController', () => {
  let controller: PendingPaymentsController;
  let getPendingPaymentsQuery: jest.Mocked<GetPendingPaymentsQueryHandler>;
  let updatePendingPaymentUseCase: jest.Mocked<UpdatePendingPaymentUseCase>;
  let deletePendingPaymentUseCase: jest.Mocked<DeletePendingPaymentUseCase>;
  let getExecuteSpy: jest.SpyInstance;
  let updateExecuteSpy: jest.SpyInstance;
  let deleteExecuteSpy: jest.SpyInstance;
  let reflector: Reflector;

  beforeEach(() => {
    getPendingPaymentsQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPendingPaymentsQueryHandler>;

    updatePendingPaymentUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdatePendingPaymentUseCase>;

    deletePendingPaymentUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeletePendingPaymentUseCase>;

    getExecuteSpy = jest.spyOn(getPendingPaymentsQuery, 'execute');
    updateExecuteSpy = jest.spyOn(updatePendingPaymentUseCase, 'execute');
    deleteExecuteSpy = jest.spyOn(deletePendingPaymentUseCase, 'execute');

    reflector = new Reflector();

    controller = new PendingPaymentsController(
      getPendingPaymentsQuery,
      updatePendingPaymentUseCase,
      deletePendingPaymentUseCase,
    );
  });

  describe('RBAC Security Metadata', () => {
    it('should allow any authenticated member to list pending payments (no admin role restriction)', () => {
      // ARRANGE
      const handler = Object.getOwnPropertyDescriptor(
        PendingPaymentsController.prototype,
        'getPendingPayments',
      )?.value as (...args: unknown[]) => unknown;

      // ACT
      const roles = reflector.get<MemberRole[]>(ROLES_KEY, handler);

      // ASSERT
      expect(roles).toBeUndefined();
    });

    it('should require ADMIN role on updatePendingPayment', () => {
      // ARRANGE
      const handler = Object.getOwnPropertyDescriptor(
        PendingPaymentsController.prototype,
        'updatePendingPayment',
      )?.value as (...args: unknown[]) => unknown;

      // ACT
      const roles = reflector.get<MemberRole[]>(ROLES_KEY, handler);

      // ASSERT
      expect(roles).toEqual([MemberRole.ADMIN]);
    });

    it('should require ADMIN role on deletePendingPayment', () => {
      // ARRANGE
      const handler = Object.getOwnPropertyDescriptor(
        PendingPaymentsController.prototype,
        'deletePendingPayment',
      )?.value as (...args: unknown[]) => unknown;

      // ACT
      const roles = reflector.get<MemberRole[]>(ROLES_KEY, handler);

      // ASSERT
      expect(roles).toEqual([MemberRole.ADMIN]);
    });
  });

  describe('getPendingPayments', () => {
    it('should return pending payments matching query', async () => {
      // ARRANGE
      const query = { status: PendingMemberPaymentStatus.PENDING };
      const mockResponse: PendingMemberPaymentResponseDto[] = [
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          memberId: 'b1ffcd0a-0d1c-5fg9-cc7e-7cc0ce491e22',
          meetingId: 'c2ggde1b-1e2d-6gh0-dd8f-8dd1df502f33',
          type: PendingMemberPaymentType.DIVIDEND,
          amount: 50000,
          status: PendingMemberPaymentStatus.PENDING,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ];
      getPendingPaymentsQuery.execute.mockResolvedValue(mockResponse);

      // ACT
      const result = await controller.getPendingPayments(query);

      // ASSERT
      expect(getExecuteSpy).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePendingPayment', () => {
    it('should execute updatePendingPaymentUseCase with id and dto', async () => {
      // ARRANGE
      const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const dto = {
        amount: 75000,
        status: PendingMemberPaymentStatus.PAID,
      };
      updatePendingPaymentUseCase.execute.mockResolvedValue(undefined);

      // ACT
      await controller.updatePendingPayment(id, dto);

      // ASSERT
      expect(updateExecuteSpy).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('deletePendingPayment', () => {
    it('should execute deletePendingPaymentUseCase with id', async () => {
      // ARRANGE
      const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      deletePendingPaymentUseCase.execute.mockResolvedValue(undefined);

      // ACT
      await controller.deletePendingPayment(id);

      // ASSERT
      expect(deleteExecuteSpy).toHaveBeenCalledWith(id);
    });
  });
});
