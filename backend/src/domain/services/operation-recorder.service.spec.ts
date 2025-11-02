import { OperationRecorder } from './operation-recorder.service';
import { OperationType } from '../../common/enums/operation-type.enum';
import {
  CASH_ACCOUNT,
  MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
} from '../../common/constants/account-types';

describe('OperationRecorder', () => {
  let recorder: OperationRecorder;

  beforeEach(() => {
    recorder = new OperationRecorder();
  });

  describe('recordOperation', () => {
    it('debe crear Operation y LedgerEntries correctamente', () => {
      // Arrange
      const context = {
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Pago mensual',
        meetingId: 'meeting-1',
        memberId: 'member-1',
      };

      const specs = [
        {
          accountType: CASH_ACCOUNT,
          amount: 100,
          description: 'Pago recibido',
        },
        {
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -100,
          description: 'Contribuci?n obligatoria',
        },
      ];

      // Act
      const result = recorder.recordOperation(context, specs);

      // Assert
      expect(result.operation).toBeDefined();
      expect(result.operation.type).toBe(OperationType.MONTHLY_PAYMENT);
      expect(result.operation.description).toBe('Pago mensual');
      expect(result.ledgerEntries).toHaveLength(2);
      expect(result.ledgerEntries[0].account_type).toBe(CASH_ACCOUNT);
      expect(result.ledgerEntries[1].account_type).toBe(
        MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
      );
    });

    it('debe lanzar error si d?bitos ? cr?ditos', () => {
      // Arrange
      const context = {
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Pago mensual',
        meetingId: 'meeting-1',
      };

      const specs = [
        {
          accountType: CASH_ACCOUNT,
          amount: 100, // D?bito
        },
        {
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -50, // Cr?dito menor
        },
      ];

      // Act & Assert
      expect(() => recorder.recordOperation(context, specs)).toThrow(
        'Los d?bitos deben igualar a los cr?ditos',
      );
    });

    it('debe lanzar error si hay menos de 2 asientos', () => {
      // Arrange
      const context = {
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Pago mensual',
        meetingId: 'meeting-1',
      };

      const specs = [
        {
          accountType: CASH_ACCOUNT,
          amount: 100,
        },
      ];

      // Act & Assert
      expect(() => recorder.recordOperation(context, specs)).toThrow(
        'Debe haber al menos 2 asientos contables',
      );
    });

    it('debe tolerar diferencias menores a 0.01', () => {
      // Arrange
      const context = {
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Pago mensual',
        meetingId: 'meeting-1',
      };

      const specs = [
        {
          accountType: CASH_ACCOUNT,
          amount: 100,
        },
        {
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -99.999, // Diferencia de 0.001
        },
      ];

      // Act
      const result = recorder.recordOperation(context, specs);

      // Assert
      expect(result.operation).toBeDefined();
      expect(result.ledgerEntries).toHaveLength(2);
    });

    it('debe asociar ledger entries a la operation', () => {
      // Arrange
      const context = {
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Pago mensual',
        meetingId: 'meeting-1',
      };

      const specs = [
        {
          accountType: CASH_ACCOUNT,
          amount: 100,
        },
        {
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -100,
        },
      ];

      // Act
      const result = recorder.recordOperation(context, specs);

      // Assert
      // Los operation_id se asignar?n al persistir, aqu? solo verificamos que los objetos se crearon
      expect(result.ledgerEntries.length).toBeGreaterThan(0);
      expect(result.operation).toBeDefined();
    });

    it('debe incluir informaci?n adicional de los specs en los ledger entries', () => {
      // Arrange
      const context = {
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Pago mensual',
        meetingId: 'meeting-1',
      };

      const specs = [
        {
          accountType: CASH_ACCOUNT,
          amount: 100,
          description: 'Pago recibido',
        },
        {
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -100,
          description: 'Contribuci?n',
          mandatoryContributionId: 'contrib-1',
          loanId: 'loan-1',
          stockId: 'stock-1',
        },
      ];

      // Act
      const result = recorder.recordOperation(context, specs);

      // Assert
      const entryWithRefs = result.ledgerEntries.find(
        (e) => e.account_type === MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
      );
      expect(entryWithRefs?.description).toBe('Contribuci?n');
      expect(entryWithRefs?.mandatory_contribution_id).toBe('contrib-1');
      expect(entryWithRefs?.loan_id).toBe('loan-1');
      expect(entryWithRefs?.stock_id).toBe('stock-1');
    });

    it('debe rechazar diferencias mayores a 0.01', () => {
      // Arrange
      const context = {
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Pago mensual',
        meetingId: 'meeting-1',
      };

      const specs = [
        {
          accountType: CASH_ACCOUNT,
          amount: 100,
        },
        {
          accountType: MANDATORY_CONTRIBUTION_INCOME_ACCOUNT,
          amount: -99.98, // Diferencia de 0.02
        },
      ];

      // Act & Assert
      expect(() => recorder.recordOperation(context, specs)).toThrow(
        'Los d?bitos deben igualar a los cr?ditos',
      );
    });
  });
});
