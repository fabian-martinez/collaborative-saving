import {
  LoanTransactionDetail,
  LoanTransactionType,
} from './loan-transaction-detail.entity';

describe('LoanTransactionDetail Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create LoanTransactionDetail with required fields', () => {
      const transaction = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });

      expect(transaction.id).toBeDefined();
      expect(transaction.loanId).toBe('loan-1');
      expect(transaction.transactionType).toBe('principal_payment');
      expect(transaction.amount).toBe(500);
      expect(transaction.transactionDate).toBeInstanceOf(Date);
    });

    it('should accept optional transactionDate', () => {
      const transaction = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.DISBURSEMENT,
        amount: 1000,
        transactionDate: mockDate,
      });

      expect(transaction.transactionDate).toEqual(mockDate);
    });

    it('should accept optional notes', () => {
      const transaction = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.INTEREST_PAYMENT,
        amount: 100,
        notes: 'Monthly interest',
      });

      expect(transaction.notes).toBe('Monthly interest');
    });

    it('should accept optional operationId', () => {
      const transaction = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
        operationId: 'operation-1',
      });

      expect(transaction.operationId).toBe('operation-1');
    });

    it('should generate unique IDs for each transaction', () => {
      const t1 = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });
      const t2 = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });

      expect(t1.id).not.toBe(t2.id);
    });

    it('should throw error for invalid amount', () => {
      expect(() =>
        LoanTransactionDetail.create({
          loanId: 'loan-1',
          transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
          amount: 0,
        }),
      ).toThrow('LoanTransactionDetail amount must be > 0');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create LoanTransactionDetail from persistence data', () => {
      const transaction = LoanTransactionDetail.fromPersistence({
        id: mockId,
        loan_id: 'loan-1',
        transaction_type: 'principal_payment',
        amount: 500,
        transaction_date: mockDate,
      });

      expect(transaction.id).toBe(mockId);
      expect(transaction.loanId).toBe('loan-1');
      expect(transaction.transactionType).toBe('principal_payment');
      expect(transaction.amount).toBe(500);
    });

    it('should handle string dates', () => {
      const transaction = LoanTransactionDetail.fromPersistence({
        id: mockId,
        loan_id: 'loan-1',
        transaction_type: 'principal_payment',
        amount: 500,
        transaction_date: '2024-01-15',
      });

      expect(transaction.transactionDate).toBeInstanceOf(Date);
    });

    it('should handle string amount', () => {
      const transaction = LoanTransactionDetail.fromPersistence({
        id: mockId,
        loan_id: 'loan-1',
        transaction_type: 'principal_payment',
        amount: '500.50',
        transaction_date: mockDate,
      });

      expect(transaction.amount).toBe(500.5);
    });

    it('should handle nullable notes and operationId', () => {
      const transaction = LoanTransactionDetail.fromPersistence({
        id: mockId,
        loan_id: 'loan-1',
        transaction_type: 'principal_payment',
        amount: 500,
        transaction_date: mockDate,
        notes: null,
        operation_id: null,
      });

      expect(transaction.notes).toBeUndefined();
      expect(transaction.operationId).toBeUndefined();
    });
  });

  describe('update method', () => {
    let transaction: LoanTransactionDetail;

    beforeEach(() => {
      transaction = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
      });
    });

    it('should update amount', () => {
      transaction.update({ amount: 750 });
      expect(transaction.amount).toBe(750);
    });

    it('should update transactionDate', () => {
      const newDate = new Date('2024-02-15');
      transaction.update({ transactionDate: newDate });
      expect(transaction.transactionDate).toEqual(newDate);
    });

    it('should update notes', () => {
      transaction.update({ notes: 'Updated notes' });
      expect(transaction.notes).toBe('Updated notes');
    });

    it('should clear notes when set to null', () => {
      transaction.update({ notes: 'Some notes' });
      transaction.update({ notes: null });
      expect(transaction.notes).toBeNull();
    });

    it('should update operationId', () => {
      transaction.update({ operationId: 'operation-2' });
      expect(transaction.operationId).toBe('operation-2');
    });

    it('should throw error for invalid amount', () => {
      expect(() => transaction.update({ amount: 0 })).toThrow(
        'LoanTransactionDetail amount must be > 0',
      );
    });
  });

  describe('getters', () => {
    let transaction: LoanTransactionDetail;

    beforeEach(() => {
      transaction = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
        notes: 'Test notes',
        operationId: 'operation-1',
      });
    });

    it('should return loanId via getter', () => {
      expect(transaction.loanId).toBe('loan-1');
    });

    it('should return transactionType via getter', () => {
      expect(transaction.transactionType).toBe('principal_payment');
    });

    it('should return amount via getter', () => {
      expect(transaction.amount).toBe(500);
    });

    it('should return transactionDate via getter', () => {
      expect(transaction.transactionDate).toBeInstanceOf(Date);
    });

    it('should return notes via getter', () => {
      expect(transaction.notes).toBe('Test notes');
    });

    it('should return operationId via getter', () => {
      expect(transaction.operationId).toBe('operation-1');
    });
  });
});
