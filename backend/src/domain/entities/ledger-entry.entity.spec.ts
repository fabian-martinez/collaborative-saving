import { LedgerEntry } from './ledger-entry.entity';

describe('LedgerEntry Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create LedgerEntry with required fields (debit)', () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'cash',
        amount: 1000,
      });

      expect(entry.id).toBeDefined();
      expect(entry.operationId).toBe('operation-1');
      expect(entry.accountType).toBe('cash');
      expect(entry.amount).toBe(1000);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.isDebit()).toBe(true);
      expect(entry.isCredit()).toBe(false);
    });

    it('should create LedgerEntry with credit (negative amount)', () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'accounts_payable',
        amount: -500,
      });

      expect(entry.amount).toBe(-500);
      expect(entry.isDebit()).toBe(false);
      expect(entry.isCredit()).toBe(true);
    });

    it('should accept optional description', () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'cash',
        amount: 1000,
        description: 'Payment received',
      });

      expect(entry.description).toBe('Payment received');
    });

    it('should accept optional entity references', () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'loan_portfolio',
        amount: 5000,
        loanId: 'loan-1',
      });

      expect(entry.loanId).toBe('loan-1');
    });

    it('should generate unique IDs for each entry', () => {
      const e1 = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'cash',
        amount: 1000,
      });
      const e2 = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'cash',
        amount: 1000,
      });

      expect(e1.id).not.toBe(e2.id);
    });

    it('should throw error for zero amount', () => {
      expect(() =>
        LedgerEntry.create({
          operationId: 'operation-1',
          accountType: 'cash',
          amount: 0,
        }),
      ).toThrow('LedgerEntry amount cannot be 0');
    });

    it('should throw error for empty accountType', () => {
      expect(() =>
        LedgerEntry.create({
          operationId: 'operation-1',
          accountType: '',
          amount: 1000,
        }),
      ).toThrow('LedgerEntry accountType is required');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create LedgerEntry from persistence data', () => {
      const entry = LedgerEntry.fromPersistence({
        id: mockId,
        operation_id: 'operation-1',
        account_type: 'cash',
        amount: 1000,
        created_at: mockDate,
      });

      expect(entry.id).toBe(mockId);
      expect(entry.operationId).toBe('operation-1');
      expect(entry.accountType).toBe('cash');
      expect(entry.amount).toBe(1000);
    });

    it('should handle string dates', () => {
      const entry = LedgerEntry.fromPersistence({
        id: mockId,
        operation_id: 'operation-1',
        account_type: 'cash',
        amount: 1000,
        created_at: '2024-01-15T10:00:00Z',
      });

      expect(entry.createdAt).toBeInstanceOf(Date);
    });

    it('should handle string amount', () => {
      const entry = LedgerEntry.fromPersistence({
        id: mockId,
        operation_id: 'operation-1',
        account_type: 'cash',
        amount: '1000.50',
        created_at: mockDate,
      });

      expect(entry.amount).toBe(1000.5);
    });

    it('should handle nullable optional fields', () => {
      const entry = LedgerEntry.fromPersistence({
        id: mockId,
        operation_id: 'operation-1',
        account_type: 'cash',
        amount: 1000,
        created_at: mockDate,
        description: null,
        loan_id: null,
        stock_id: null,
        mandatory_contribution_id: null,
        stock_subscription_id: null,
      });

      expect(entry.description).toBeUndefined();
      expect(entry.loanId).toBeUndefined();
      expect(entry.stockId).toBeUndefined();
    });
  });

  describe('update method', () => {
    let entry: LedgerEntry;

    beforeEach(() => {
      entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'cash',
        amount: 1000,
      });
    });

    it('should update accountType', () => {
      entry.update({ accountType: 'accounts_receivable' });
      expect(entry.accountType).toBe('accounts_receivable');
    });

    it('should update amount', () => {
      entry.update({ amount: 2000 });
      expect(entry.amount).toBe(2000);
    });

    it('should update description', () => {
      entry.update({ description: 'Updated description' });
      expect(entry.description).toBe('Updated description');
    });

    it('should clear description when set to null', () => {
      entry.update({ description: 'Some description' });
      entry.update({ description: null });
      expect(entry.description).toBeNull();
    });

    it('should throw error for zero amount', () => {
      expect(() => entry.update({ amount: 0 })).toThrow(
        'LedgerEntry amount cannot be 0',
      );
    });
  });

  describe('isDebit and isCredit methods', () => {
    it('should return true for debit (positive amount)', () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'cash',
        amount: 1000,
      });

      expect(entry.isDebit()).toBe(true);
      expect(entry.isCredit()).toBe(false);
    });

    it('should return true for credit (negative amount)', () => {
      const entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'accounts_payable',
        amount: -500,
      });

      expect(entry.isDebit()).toBe(false);
      expect(entry.isCredit()).toBe(true);
    });
  });

  describe('getters', () => {
    let entry: LedgerEntry;

    beforeEach(() => {
      entry = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: 'cash',
        amount: 1000,
        description: 'Test entry',
        loanId: 'loan-1',
      });
    });

    it('should return operationId via getter', () => {
      expect(entry.operationId).toBe('operation-1');
    });

    it('should return accountType via getter', () => {
      expect(entry.accountType).toBe('cash');
    });

    it('should return amount via getter', () => {
      expect(entry.amount).toBe(1000);
    });

    it('should return description via getter', () => {
      expect(entry.description).toBe('Test entry');
    });

    it('should return loanId via getter', () => {
      expect(entry.loanId).toBe('loan-1');
    });
  });
});

