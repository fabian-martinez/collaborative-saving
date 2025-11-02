import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RecordMonthlyPaymentsUseCase } from './record-monthly-payments.use-case';
import { OperationRecorder } from '@domain/services/operation-recorder.service';
import { LoanPaymentProcessor } from '@domain/services/loan-payment-processor.service';
import { DuesService } from '../../../dues/dues.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { OperationType } from '../../../common/enums/operation-type.enum';

describe('RecordMonthlyPaymentsUseCase', () => {
  let useCase: RecordMonthlyPaymentsUseCase;
  let operationRecorder: jest.Mocked<OperationRecorder>;
  let loanPaymentProcessor: jest.Mocked<LoanPaymentProcessor>;
  let duesService: jest.Mocked<DuesService>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordMonthlyPaymentsUseCase,
        {
          provide: OperationRecorder,
          useValue: {
            recordOperation: jest.fn(),
          },
        },
        {
          provide: LoanPaymentProcessor,
          useValue: {
            processPayment: jest.fn(),
          },
        },
        {
          provide: DuesService,
          useValue: {
            getMemberDuesForActiveMeeting: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                save: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
              },
            }),
          },
        },
      ],
    }).compile();

    useCase = module.get<RecordMonthlyPaymentsUseCase>(
      RecordMonthlyPaymentsUseCase,
    );
    operationRecorder = module.get(OperationRecorder);
    loanPaymentProcessor = module.get(LoanPaymentProcessor);
    duesService = module.get(DuesService);
    dataSource = module.get(DataSource);
  });

  it('debe registrar pago exitosamente', async () => {
    // Arrange
    const dto = {
      memberId: 'member-1',
      payments: [
        {
          type: 'mandatory_contribution' as const,
          amount: 100,
          description: 'Contribuci?n',
          referenceId: 'contrib-1',
        },
      ],
    };

    const expectedDues = [
      {
        type: 'mandatory_contribution' as const,
        amount: 100,
        description: 'Contribuci?n',
        referenceId: 'contrib-1',
      },
    ];

    duesService.getMemberDuesForActiveMeeting.mockResolvedValue(expectedDues);
    operationRecorder.recordOperation.mockReturnValue({
      operation: {
        id: 'operation-1',
        type: OperationType.MONTHLY_PAYMENT,
        meeting_id: 'meeting-1',
        member_id: 'member-1',
      } as any,
      ledgerEntries: [
        {
          account_type: 'CASH',
          amount: 100,
        },
        {
          account_type: 'MANDATORY_CONTRIBUTION_INCOME',
          amount: -100,
        },
      ] as any[],
    });

    const queryRunner = dataSource.createQueryRunner();
    queryRunner.manager.save.mockResolvedValueOnce({ id: 'operation-1' });
    queryRunner.manager.save.mockResolvedValueOnce({ id: 'ledger-1' });

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.operationId).toBe('operation-1');
    expect(result.paymentsProcessed).toBe(1);
    expect(operationRecorder.recordOperation).toHaveBeenCalled();
  });

  it('debe lanzar error si no hay reuni?n activa', async () => {
    // Arrange
    const dto = {
      memberId: 'member-1',
      payments: [],
    };

    duesService.getMemberDuesForActiveMeeting.mockRejectedValue(
      new NotFoundException('No active meeting found.'),
    );

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
  });

  it('debe validar contra cuotas calculadas', async () => {
    // Arrange
    const dto = {
      memberId: 'member-1',
      payments: [
        {
          type: 'mandatory_contribution' as const,
          amount: 150, // Excede la cuota de 100
          description: 'Contribuci?n',
          referenceId: 'contrib-1',
        },
      ],
    };

    const expectedDues = [
      {
        type: 'mandatory_contribution' as const,
        amount: 100,
        description: 'Contribuci?n',
        referenceId: 'contrib-1',
      },
    ];

    duesService.getMemberDuesForActiveMeeting.mockResolvedValue(expectedDues);

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
  });
});
