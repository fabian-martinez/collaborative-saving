import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsService } from './meetings.service';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { Operation } from '../operations/entities/operation.entity';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { Meeting } from './entities/meeting.entity';
import { OperationsService } from '../operations/operations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTransactionPaymentDto } from './dto/create-transaction-payment.dto';
import { PaymentType } from '../common/enums/payment-type.enum';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common/exceptions';
import { StocksService } from '../stocks/stocks.service';
import { DisbursementStrategyFactory } from './strategies/disbursement-strategy.factory';

// Interface para la estrategia de pago mock
interface MockPaymentStrategy {
  handle: jest.Mock;
  process: jest.Mock;
}

describe('MeetingsService', () => {
  let service: MeetingsService;
  let meetingRepository: jest.Mocked<Repository<Meeting>>;
  let operationRepository: jest.Mocked<Repository<Operation>>;
  let paymentStrategyFactory: jest.Mocked<PaymentStrategyFactory>;
  // let operationsService: jest.Mocked<OperationsService>;
  let dataSource: jest.Mocked<DataSource>;
  let stocksService: jest.Mocked<StocksService>;
  let disbursementStrategyFactory: jest.Mocked<DisbursementStrategyFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        {
          provide: getRepositoryToken(Meeting),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Operation),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: PaymentStrategyFactory,
          useValue: {
            getStrategy: jest.fn(),
          },
        },
        {
          provide: OperationsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
            manager: {
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn(),
              }),
              findOne: jest.fn().mockResolvedValue(null),
            },
          },
        },
        {
          provide: StocksService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DisbursementStrategyFactory,
          useValue: {
            getStrategy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
    meetingRepository = module.get(getRepositoryToken(Meeting));
    operationRepository = module.get(getRepositoryToken(Operation));
    paymentStrategyFactory = module.get(PaymentStrategyFactory);
    // operationsService = module.get(OperationsService);
    dataSource = module.get(DataSource);
    stocksService = module.get(StocksService);
    disbursementStrategyFactory = module.get(DisbursementStrategyFactory);
  });

  describe('recordMonthlyPayment', () => {
    // --- Preparación de datos de prueba comunes ---
    const memberId = 'test-member-id';
    const meetingId = 'active-meeting-id';
    const payments: CreateTransactionPaymentDto[] = [
      {
        type: PaymentType.MANDATORY_CONTRIBUTION,
        amount: 1500,
        description: 'Aporte obligatorio del mes',
        referenceId: 'test-reference-id',
      },
    ];
    const payload = {
      memberId,
      payments,
    };
    const mockActiveMeeting = { id: meetingId, status: 'active' };
    const mockMember = {
      id: 'member-1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    // --- Preparación de nuestras simulaciones (Mocks) ---
    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        create: jest.fn().mockReturnValue({ id: 'mock-operation-id', type: 'MEMBER_PAYMENT' }),
        find: jest.fn().mockResolvedValue([]),
      },
    };

    const mockPaymentStrategy = {
      handle: jest.fn(),
      process: jest.fn().mockReturnValue([]),
    };

    // Esto se ejecuta antes de CADA caso de prueba en este conjunto.
    // Es como un script de "reset" para asegurar que cada prueba empieza limpia.
    beforeEach(() => {
      jest.clearAllMocks(); // Limpia el historial de llamadas de los mocks.

      // Le decimos a nuestros mocks cómo comportarse por defecto para estos tests:
      dataSource.createQueryRunner.mockReturnValue(
        mockQueryRunner as unknown as QueryRunner,
      );
      meetingRepository.findOne.mockResolvedValue(mockActiveMeeting as Meeting);
      operationRepository.count.mockResolvedValue(0); // Simulamos que el socio no ha pagado.
      paymentStrategyFactory.getStrategy.mockReturnValue(
        mockPaymentStrategy as MockPaymentStrategy,
      );
      
      // Mock del payment strategy para que procese correctamente
      mockPaymentStrategy.process.mockResolvedValue([]);
    });

    // --- Nuestro Primer Caso de Prueba ---
    it('should process a successful payment and commit the transaction', async () => {
      // 1. Preparar (Arrange)
      // En este caso, el beforeEach ya hizo casi todo. Solo simulamos
      // que al guardar la operación, la base de datos nos devuelve un ID.
      mockQueryRunner.manager.save.mockResolvedValue({
        id: 'new-op-id',
      });

      // 2. Ejecutar (Act)
      // Llamamos al método que queremos probar.
      const result = await service.recordMonthlyPayment(payload);

      // 3. Verificar (Assert)
      // Usamos `expect` para comprobar los resultados, como si fueras un robot
      // revisando cada paso del plan de pruebas manual.

      // Verificamos que se manejó una transacción de base de datos correctamente.
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();

      // Verificamos que se intentó guardar en la BD una operación de pago.
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'MEMBER_PAYMENT' }),
      );

      // Verificamos que se usó la estrategia de pago correcta.
      expect(paymentStrategyFactory.getStrategy).toHaveBeenCalledWith(
        PaymentType.MANDATORY_CONTRIBUTION,
      );
      expect(mockPaymentStrategy.process).toHaveBeenCalledTimes(1);

      // Verificamos que el resultado final del método es el esperado.
      expect(result).toHaveProperty('operation.id', 'mock-operation-id');
    });

    it('should throw NotFoundException if no active meeting is found', async () => {
      // Arrange
      meetingRepository.findOne.mockResolvedValue(null);

      // Act
      await expect(() => service.recordMonthlyPayment(payload)).rejects.toThrow(
        NotFoundException,
      );

      // Assert
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });
    it('should throw BadRequestException if the member has already paid', async () => {
      // Arrange
               // Mock que ya existe un pago previo
         (dataSource.manager.getRepository as jest.Mock).mockReturnValue({
           findOne: jest.fn().mockResolvedValue({
             id: 'existing-operation-id',
             type: 'MONTHLY_PAYMENT',
           }),
         });

      // Act
      await expect(() => service.recordMonthlyPayment(payload)).rejects.toThrow(
        BadRequestException,
      );

      // Assert
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
