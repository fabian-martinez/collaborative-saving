import { Operation } from './operation.entity';
import { OperationType } from '../enums/operation-type.enum';

describe('Operation Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create Operation with required fields', () => {
      const operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      expect(operation.id).toBeDefined();
      expect(operation.meetingId).toBe('meeting-1');
      expect(operation.type).toBe('MONTHLY_PAYMENT');
      expect(operation.date).toBeInstanceOf(Date);
    });

    it('should accept optional memberId', () => {
      const operation = Operation.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      expect(operation.memberId).toBe('member-1');
    });

    it('should accept null memberId', () => {
      const operation = Operation.create({
        memberId: null,
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      expect(operation.memberId).toBeNull();
    });

    it('should accept optional date', () => {
      const operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: mockDate,
      });

      expect(operation.date).toEqual(mockDate);
    });

    it('should accept optional description', () => {
      const operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Monthly payment for member',
      });

      expect(operation.description).toBe('Monthly payment for member');
    });

    it('should generate unique IDs for each operation', () => {
      const op1 = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });
      const op2 = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });

      expect(op1.id).not.toBe(op2.id);
    });

    it('should throw error for empty type', () => {
      expect(() =>
        Operation.create({
          meetingId: 'meeting-1',
          type: '' as OperationType,
        }),
      ).toThrow('Operation type is required');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create Operation from persistence data', () => {
      const operation = Operation.fromPersistence({
        id: mockId,
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: mockDate,
      });

      expect(operation.id).toBe(mockId);
      expect(operation.meetingId).toBe('meeting-1');
      expect(operation.type).toBe('MONTHLY_PAYMENT');
    });

    it('should handle string dates', () => {
      const operation = Operation.fromPersistence({
        id: mockId,
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: '2024-01-15T10:00:00Z',
      });

      expect(operation.date).toBeInstanceOf(Date);
    });

    it('should handle nullable memberId', () => {
      const operation = Operation.fromPersistence({
        id: mockId,
        memberId: null,
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: mockDate,
      });

      expect(operation.memberId).toBeNull();
    });

    it('should handle nullable description', () => {
      const operation = Operation.fromPersistence({
        id: mockId,
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        date: mockDate,
        description: null,
      });

      expect(operation.description).toBeUndefined();
    });
  });

  describe('update method', () => {
    let operation: Operation;

    beforeEach(() => {
      operation = Operation.create({
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
      });
    });

    it('should update memberId', () => {
      operation.update({ memberId: 'member-2' });
      expect(operation.memberId).toBe('member-2');
    });

    it('should clear memberId when set to null', () => {
      operation.update({ memberId: 'member-1' });
      operation.update({ memberId: null });
      expect(operation.memberId).toBeNull();
    });

    it('should update type', () => {
      operation.update({ type: OperationType.LOAN_PAYMENT });
      expect(operation.type).toBe(OperationType.LOAN_PAYMENT);
    });

    it('should update description', () => {
      operation.update({ description: 'Updated description' });
      expect(operation.description).toBe('Updated description');
    });

    it('should clear description when set to null', () => {
      operation.update({ description: 'Some description' });
      operation.update({ description: null });
      expect(operation.description).toBeNull();
    });

    it('should not update fields that are not provided', () => {
      const originalType = operation.type;
      operation.update({ description: 'Only description' });
      expect(operation.type).toBe(originalType);
    });
  });

  describe('getters', () => {
    let operation: Operation;

    beforeEach(() => {
      operation = Operation.create({
        memberId: 'member-1',
        meetingId: 'meeting-1',
        type: OperationType.MONTHLY_PAYMENT,
        description: 'Test operation',
      });
    });

    it('should return memberId via getter', () => {
      expect(operation.memberId).toBe('member-1');
    });

    it('should return meetingId via getter', () => {
      expect(operation.meetingId).toBe('meeting-1');
    });

    it('should return type via getter', () => {
      expect(operation.type).toBe('MONTHLY_PAYMENT');
    });

    it('should return date via getter', () => {
      expect(operation.date).toBeInstanceOf(Date);
    });

    it('should return description via getter', () => {
      expect(operation.description).toBe('Test operation');
    });
  });

  describe('invariants validation', () => {
    it('should throw error when date is in the future via fromPersistence', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // fromPersistence validates the date invariant
      expect(() =>
        Operation.fromPersistence({
          id: '550e8400-e29b-41d4-a716-446655440000',
          meetingId: 'meeting-1',
          type: OperationType.MONTHLY_PAYMENT,
          date: futureDate,
        }),
      ).toThrow('Operation date cannot be in the future');
    });
  });
});
