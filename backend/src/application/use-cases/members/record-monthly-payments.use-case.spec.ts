import { RecordMonthlyPaymentsUseCase } from './record-monthly-payments.use-case';
import { RecordMonthlyPaymentsDto } from '@application/dto/members/record-monthly-payments.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { RecordOperationUseCase } from '@application/use-cases/accounting/record-operation.use-case';
import { RecordLoanPaymentUseCase } from '@application/use-cases/loans/record-loan-payment.use-case';
import { Member } from '@domain/entities/member.entity';
import { Meeting } from '@domain/entities/meeting.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import { InvalidPaymentException } from '@application/exceptions/invalid-payment.exception';
import { DuplicateMonthlyPaymentException } from '@application/exceptions/duplicate-monthly-payment.exception';
import { PaymentType } from '@application/dto/members/payment-item.dto';
import { OperationType } from '@domain/enums/operation-type.enum';
import { Operation } from '@domain/entities/operation.entity';
import { RecordOperationDto } from '@application/dto/accounting/record-operation.dto';

describe('RecordMonthlyPaymentsUseCase', () => {
  let useCase: RecordMonthlyPaymentsUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let meetingRepository: jest.Mocked<MeetingRepository>;
  let operationRepository: jest.Mocked<OperationRepository>;
  let recordOperationUseCase: jest.Mocked<RecordOperationUseCase>;
  let recordLoanPaymentUseCase: jest.Mocked<RecordLoanPaymentUseCase>;
  let findByIdSpy: jest.SpyInstance;
  let findActiveSpy: jest.SpyInstance;
  let findByMemberSpy: jest.SpyInstance;
  let recordOperationExecuteSpy: jest.SpyInstance;
  let recordLoanPaymentExecuteSpy: jest.SpyInstance;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    meetingRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      findLatestClosed: jest.fn(),
    };

    operationRepository = {
      findById: jest.fn(),
      findByMeeting: jest.fn(),
      findByMeetingAndType: jest.fn(),
      findByMember: jest.fn(),
      save: jest.fn(),
      saveWithEntries: jest.fn(),
    } as unknown as jest.Mocked<OperationRepository>;

    recordOperationUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordOperationUseCase>;

    recordLoanPaymentUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RecordLoanPaymentUseCase>;

    findByIdSpy = jest.spyOn(memberRepository, 'findById');
    findActiveSpy = jest.spyOn(meetingRepository, 'findActive');
    findByMemberSpy = jest.spyOn(operationRepository, 'findByMember');
    recordOperationExecuteSpy = jest.spyOn(recordOperationUseCase, 'execute');
    recordLoanPaymentExecuteSpy = jest.spyOn(
      recordLoanPaymentUseCase,
      'execute',
    );

    // Default: no existing payments
    findByMemberSpy.mockResolvedValue([]);

    useCase = new RecordMonthlyPaymentsUseCase(
      memberRepository,
      meetingRepository,
      operationRepository,
      recordOperationUseCase,
      recordLoanPaymentUseCase,
    );
  });

  describe('execute', () => {
    const validDto: RecordMonthlyPaymentsDto = {
      memberId: 'member-id',
      payments: [
        {
          type: PaymentType.STOCK_FEE,
          amount: 100,
          description: 'Cuota de acciones',
        },
        {
          type: PaymentType.MANDATORY_CONTRIBUTION,
          amount: 50,
          description: 'Aporte obligatorio',
        },
      ],
    };

    const mockMember = Member.create({
      name: 'Test Member',
      email: 'test@example.com',
    });

    const mockMeeting = Meeting.create({
      date: new Date('2024-01-15'),
    });

    it('should record payments successfully with multiple payment types', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2', 'entry-3'],
      });

      // ACT
      const result = await useCase.execute(validDto);

      // ASSERT
      expect(findByIdSpy).toHaveBeenCalledWith('member-id');
      expect(findActiveSpy).toHaveBeenCalledTimes(1);
      expect(recordOperationExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result.operationId).toBe('operation-id');
      expect(result.memberId).toBe('member-id');
      expect(result.meetingId).toBe(mockMeeting.id);
      expect(result.ledgerEntryIds).toEqual(['entry-1', 'entry-2', 'entry-3']);
    });

    it('should throw MemberNotFoundException when member does not exist', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(useCase.execute(validDto)).rejects.toThrow(
        MemberNotFoundException,
      );
      expect(findByIdSpy).toHaveBeenCalledWith('member-id');
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });

    it('should throw MeetingNotFoundException when no active meeting exists', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(useCase.execute(validDto)).rejects.toThrow(
        MeetingNotFoundException,
      );
      expect(findActiveSpy).toHaveBeenCalledTimes(1);
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });

    it('should use provided meetingId when available', async () => {
      // ARRANGE
      const dtoWithMeeting: RecordMonthlyPaymentsDto = {
        ...validDto,
        meetingId: 'specific-meeting-id',
      };
      const findMeetingByIdSpy = jest.spyOn(meetingRepository, 'findById');
      findByIdSpy.mockResolvedValue(mockMember);
      findMeetingByIdSpy.mockResolvedValue(mockMeeting);
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      });

      // ACT
      const result = await useCase.execute(dtoWithMeeting);

      // ASSERT
      expect(findMeetingByIdSpy).toHaveBeenCalledWith('specific-meeting-id');
      expect(findActiveSpy).not.toHaveBeenCalled();
      expect(result.meetingId).toBe(mockMeeting.id);
    });

    it('should calculate correct total amount', async () => {
      // ARRANGE
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      });

      // ACT
      const result = await useCase.execute(validDto);

      // ASSERT
      expect(result.totalAmount).toBe(150); // 100 + 50
    });

    it('should validate positive amounts', async () => {
      // ARRANGE
      const invalidDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.STOCK_FEE,
            amount: -100,
            description: 'Invalid amount',
          },
        ],
      };
      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);

      // ACT & ASSERT
      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        InvalidPaymentException,
      );
    });

    it('should delegate loan payment to RecordLoanPaymentUseCase', async () => {
      // ARRANGE
      const loanId = 'loan-id';
      const loanDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.LOAN_PAYMENT,
            amount: 500,
            description: 'Loan payment',
            referenceId: loanId,
          },
        ],
      };

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      recordLoanPaymentExecuteSpy.mockResolvedValue({
        loanId,
        operationId: 'loan-operation-id',
        interestPaid: 100,
        principalPaid: 400,
        newOutstandingBalance: 4600,
        loanStatus: 'ACTIVE',
        transactionDetailIds: ['detail-1', 'detail-2'],
      });

      // ACT
      const result = await useCase.execute(loanDto);

      // ASSERT
      expect(findByIdSpy).toHaveBeenCalledWith('member-id');
      expect(recordLoanPaymentExecuteSpy).toHaveBeenCalledWith({
        loanId,
        meetingId: mockMeeting.id,
        totalPaymentAmount: 500,
        notes: 'Loan payment',
      });
      // No separate operation for non-loan payments since there are none
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
      expect(result.operationId).toBe('loan-operation-id');
      expect(result.totalAmount).toBe(500);
    });

    it('should delegate loan payment with isFullPayoff flag', async () => {
      // ARRANGE
      const loanId = 'loan-id-full-payoff';
      const loanDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.LOAN_PAYMENT,
            amount: 500,
            description: 'Liquidación total',
            referenceId: loanId,
            isFullPayoff: true,
          },
        ],
      };

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      recordLoanPaymentExecuteSpy.mockResolvedValue({
        loanId,
        operationId: 'loan-operation-id',
        interestPaid: 50,
        principalPaid: 450,
        newOutstandingBalance: 0,
        loanStatus: 'PAID',
        transactionDetailIds: ['detail-1'],
      });

      // ACT
      await useCase.execute(loanDto);

      // ASSERT
      expect(recordLoanPaymentExecuteSpy).toHaveBeenCalledWith({
        loanId,
        meetingId: mockMeeting.id,
        totalPaymentAmount: 500,
        notes: 'Liquidación total',
        isFullPayoff: true,
      });
    });

    it('should process both loan and non-loan payments', async () => {
      // ARRANGE
      const mixedDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.STOCK_FEE,
            amount: 100,
            description: 'Stock fee',
          },
          {
            type: PaymentType.LOAN_PAYMENT,
            amount: 500,
            description: 'Loan payment',
            referenceId: 'loan-id',
          },
        ],
      };

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      recordOperationExecuteSpy.mockResolvedValue({
        operationId: 'monthly-operation-id',
        ledgerEntryIds: ['entry-1', 'entry-2'],
      });
      recordLoanPaymentExecuteSpy.mockResolvedValue({
        loanId: 'loan-id',
        operationId: 'loan-operation-id',
        interestPaid: 100,
        principalPaid: 400,
        newOutstandingBalance: 4600,
        loanStatus: 'ACTIVE',
        transactionDetailIds: ['detail-1', 'detail-2'],
      });

      // ACT
      const result = await useCase.execute(mixedDto);

      // ASSERT
      // Loan payment is delegated
      expect(recordLoanPaymentExecuteSpy).toHaveBeenCalledWith({
        loanId: 'loan-id',
        meetingId: mockMeeting.id,
        totalPaymentAmount: 500,
        notes: 'Loan payment',
      });
      // Non-loan payments are processed in a separate operation
      expect(recordOperationExecuteSpy).toHaveBeenCalledTimes(1);
      expect(result.operationId).toBe('monthly-operation-id'); // Main operation is for non-loan payments
      expect(result.totalAmount).toBe(600); // 100 + 500
    });

    it('should throw InvalidPaymentException when loan payment has no referenceId', async () => {
      // ARRANGE
      const invalidDto: RecordMonthlyPaymentsDto = {
        memberId: 'member-id',
        payments: [
          {
            type: PaymentType.LOAN_PAYMENT,
            amount: 500,
            // Missing referenceId
          },
        ],
      };

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);

      // ACT & ASSERT
      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        InvalidPaymentException,
      );
      expect(recordLoanPaymentExecuteSpy).not.toHaveBeenCalled();
    });

    it('should throw DuplicateMonthlyPaymentException when member already has a monthly payment for this meeting', async () => {
      // ARRANGE
      const existingPayment = Operation.create({
        memberId: 'member-id',
        meetingId: mockMeeting.id,
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Existing monthly payment',
      });

      findByIdSpy.mockResolvedValue(mockMember);
      findActiveSpy.mockResolvedValue(mockMeeting);
      findByMemberSpy.mockResolvedValue([existingPayment]);

      // ACT & ASSERT
      await expect(useCase.execute(validDto)).rejects.toThrow(
        DuplicateMonthlyPaymentException,
      );
      expect(findByMemberSpy).toHaveBeenCalledWith('member-id', {
        meetingId: mockMeeting.id,
        types: [OperationType.MONTHLY_PAYMENT],
      });
      expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
    });

    describe('novelty payments', () => {
      it('should record novelty payment successfully without affectedPaymentType', async () => {
        // ARRANGE
        const noveltyDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 50,
              description: 'Novedad general',
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);
        recordOperationExecuteSpy.mockResolvedValue({
          operationId: 'operation-id',
          ledgerEntryIds: ['entry-1', 'entry-2'],
        });

        // ACT
        const result = await useCase.execute(noveltyDto);

        // ASSERT
        expect(recordOperationExecuteSpy).toHaveBeenCalledTimes(1);
        const recordOperationCalls = recordOperationExecuteSpy.mock
          .calls as unknown as RecordOperationDto[][];
        const callArgs = recordOperationCalls[0][0];
        expect(callArgs.entries).toHaveLength(2);
        expect(callArgs.entries[0]?.accountType).toBe('CASH');
        expect(callArgs.entries[0]?.amount).toBe(-50);
        expect(callArgs.entries[1]?.accountType).toBe('NOVELTY_LOSS');
        expect(callArgs.entries[1]?.amount).toBe(50);
        expect(result.totalAmount).toBe(50);
      });

      it('should record novelty payment with affectedPaymentType and referenceId for mandatory contribution', async () => {
        // ARRANGE
        const contributionId = 'contribution-id';
        const noveltyDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 100,
              affectedPaymentType: PaymentType.MANDATORY_CONTRIBUTION,
              referenceId: contributionId,
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);
        recordOperationExecuteSpy.mockResolvedValue({
          operationId: 'operation-id',
          ledgerEntryIds: ['entry-1', 'entry-2'],
        });

        // ACT
        await useCase.execute(noveltyDto);

        // ASSERT
        const recordOperationCalls = recordOperationExecuteSpy.mock
          .calls as unknown as RecordOperationDto[][];
        const callArgs = recordOperationCalls[0][0];
        const noveltyEntry = callArgs.entries.find(
          (e) => e.accountType === 'NOVELTY_LOSS',
        );
        expect(noveltyEntry).toBeDefined();
        expect(noveltyEntry?.mandatoryContributionId).toBe(contributionId);
        expect(noveltyEntry?.description).toContain(
          '[AFFECTED:mandatory_contribution]',
        );
        expect(noveltyEntry?.description).toContain('Aporte obligatorio');
      });

      it('should record novelty payment with affectedPaymentType and referenceId for stock fee', async () => {
        // ARRANGE
        const stockId = 'stock-id';
        const noveltyDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 75,
              affectedPaymentType: PaymentType.STOCK_FEE,
              referenceId: stockId,
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);
        recordOperationExecuteSpy.mockResolvedValue({
          operationId: 'operation-id',
          ledgerEntryIds: ['entry-1', 'entry-2'],
        });

        // ACT
        await useCase.execute(noveltyDto);

        // ASSERT
        const recordOperationCalls = recordOperationExecuteSpy.mock
          .calls as unknown as RecordOperationDto[][];
        const callArgs = recordOperationCalls[0][0];
        const noveltyEntry = callArgs.entries.find(
          (e) => e.accountType === 'NOVELTY_LOSS',
        );
        expect(noveltyEntry).toBeDefined();
        expect(noveltyEntry?.stockId).toBe(stockId);
        expect(noveltyEntry?.description).toContain('[AFFECTED:stock_fee]');
        expect(noveltyEntry?.description).toContain('Cuota de acciones');
      });

      it('should record novelty payment with affectedPaymentType for FEE (no reference)', async () => {
        // ARRANGE
        const noveltyDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 30,
              affectedPaymentType: PaymentType.FEE,
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);
        recordOperationExecuteSpy.mockResolvedValue({
          operationId: 'operation-id',
          ledgerEntryIds: ['entry-1', 'entry-2'],
        });

        // ACT
        await useCase.execute(noveltyDto);

        // ASSERT
        const recordOperationCalls = recordOperationExecuteSpy.mock
          .calls as unknown as RecordOperationDto[][];
        const callArgs = recordOperationCalls[0][0];
        const noveltyEntry = callArgs.entries.find(
          (e) => e.accountType === 'NOVELTY_LOSS',
        );
        expect(noveltyEntry).toBeDefined();
        expect(noveltyEntry?.description).toContain('[AFFECTED:fee]');
        expect(noveltyEntry?.description).toContain('Multa/otro pago');
        // No reference should be assigned for FEE
        expect(noveltyEntry?.mandatoryContributionId).toBeNull();
        expect(noveltyEntry?.stockId).toBeNull();
        expect(noveltyEntry?.loanId).toBeNull();
      });

      it('should record novelty payment with affectedPaymentType for INSURANCE (no reference)', async () => {
        // ARRANGE
        const noveltyDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 25,
              affectedPaymentType: PaymentType.INSURANCE,
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);
        recordOperationExecuteSpy.mockResolvedValue({
          operationId: 'operation-id',
          ledgerEntryIds: ['entry-1', 'entry-2'],
        });

        // ACT
        await useCase.execute(noveltyDto);

        // ASSERT
        const recordOperationCalls = recordOperationExecuteSpy.mock
          .calls as unknown as RecordOperationDto[][];
        const callArgs = recordOperationCalls[0][0];
        const noveltyEntry = callArgs.entries.find(
          (e) => e.accountType === 'NOVELTY_LOSS',
        );
        expect(noveltyEntry).toBeDefined();
        expect(noveltyEntry?.description).toContain('[AFFECTED:insurance]');
        expect(noveltyEntry?.description).toContain('Seguro de deuda');
      });

      it('should throw InvalidPaymentException when novelty has referenceId but no affectedPaymentType', async () => {
        // ARRANGE
        const invalidDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 50,
              referenceId: 'some-id',
              // Missing affectedPaymentType
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);

        // ACT & ASSERT
        await expect(useCase.execute(invalidDto)).rejects.toThrow(
          InvalidPaymentException,
        );
        await expect(useCase.execute(invalidDto)).rejects.toThrow(
          'Novelty payment with referenceId must include affectedPaymentType',
        );
        expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
      });

      it('should throw InvalidPaymentException when affectedPaymentType is NOVELTY', async () => {
        // ARRANGE
        const invalidDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 50,
              affectedPaymentType: PaymentType.NOVELTY, // Invalid
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);

        // ACT & ASSERT
        await expect(useCase.execute(invalidDto)).rejects.toThrow(
          InvalidPaymentException,
        );
        await expect(useCase.execute(invalidDto)).rejects.toThrow(
          'affectedPaymentType cannot be NOVELTY',
        );
        expect(recordOperationExecuteSpy).not.toHaveBeenCalled();
      });

      it('should use custom description when provided with affectedPaymentType', async () => {
        // ARRANGE
        const noveltyDto: RecordMonthlyPaymentsDto = {
          memberId: 'member-id',
          payments: [
            {
              type: PaymentType.NOVELTY,
              amount: 50,
              affectedPaymentType: PaymentType.FEE,
              description: 'Novedad personalizada',
            },
          ],
        };

        findByIdSpy.mockResolvedValue(mockMember);
        findActiveSpy.mockResolvedValue(mockMeeting);
        recordOperationExecuteSpy.mockResolvedValue({
          operationId: 'operation-id',
          ledgerEntryIds: ['entry-1', 'entry-2'],
        });

        // ACT
        await useCase.execute(noveltyDto);

        // ASSERT
        const recordOperationCalls = recordOperationExecuteSpy.mock
          .calls as unknown as RecordOperationDto[][];
        const callArgs = recordOperationCalls[0][0];
        const noveltyEntry = callArgs.entries.find(
          (e) => e.accountType === 'NOVELTY_LOSS',
        );
        expect(noveltyEntry?.description).toBe(
          '[AFFECTED:fee]Novedad personalizada',
        );
      });
    });
  });
});
