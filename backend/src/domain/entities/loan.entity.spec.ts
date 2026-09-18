import { Loan, LoanStatus } from './loan.entity';

describe('Loan Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create Loan with required fields', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });

      expect(loan.id).toBeDefined();
      expect(loan.memberId).toBe('member-1');
      expect(loan.loanType).toBe('corriente');
      expect(loan.approvedAmount).toBe(10000);
      expect(loan.disbursedAmount).toBe(0);
      expect(loan.outstandingBalance).toBe(10000);
      expect(loan.monthlyPaymentAmount).toBe(500);
      expect(loan.interestRate).toBe(0.02);
      expect(loan.term).toBe(24);
      expect(loan.status).toBe('pending');
      expect(loan.creationDate).toBeInstanceOf(Date);
    });

    it('should accept optional guaranteedStockId', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
        guaranteedStockId: 'stock-1',
      });

      expect(loan.guaranteedStockId).toBe('stock-1');
    });

    it('should generate unique IDs for each loan', () => {
      const loan1 = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      const loan2 = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });

      expect(loan1.id).not.toBe(loan2.id);
    });

    it('should throw error for invalid approvedAmount', () => {
      expect(() =>
        Loan.create({
          memberId: 'member-1',
          loanType: 'corriente',
          approvedAmount: 0,
          monthlyPaymentAmount: 500,
          interestRate: 0.02,
          term: 24,
        }),
      ).toThrow('Loan approved amount must be > 0');
    });

    it('should throw error for invalid interestRate', () => {
      expect(() =>
        Loan.create({
          memberId: 'member-1',
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 500,
          interestRate: 1.5,
          term: 24,
        }),
      ).toThrow('Interest rate must be between 0 and 1');
    });

    it('should throw error for invalid term', () => {
      expect(() =>
        Loan.create({
          memberId: 'member-1',
          loanType: 'corriente',
          approvedAmount: 10000,
          monthlyPaymentAmount: 500,
          interestRate: 0.02,
          term: 0,
        }),
      ).toThrow('Loan term must be >= 1');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create Loan from persistence data', () => {
      const loan = Loan.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        loan_type: 'corriente',
        approved_amount: 10000,
        disbursed_amount: 5000,
        outstanding_balance: 5000, // Debe ser <= disbursed_amount cuando disbursed > 0
        monthly_payment_amount: 500,
        interest_rate: 0.02,
        term: 24,
        status: 'active',
        creation_date: mockDate,
      });

      expect(loan.id).toBe(mockId);
      expect(loan.memberId).toBe('member-1');
      expect(loan.approvedAmount).toBe(10000);
      expect(loan.disbursedAmount).toBe(5000);
      expect(loan.outstandingBalance).toBe(5000);
      expect(loan.status).toBe('active');
    });

    it('should handle string dates', () => {
      const loan = Loan.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        loan_type: 'corriente',
        approved_amount: 10000,
        disbursed_amount: 0,
        outstanding_balance: 10000,
        monthly_payment_amount: 500,
        interest_rate: 0.02,
        term: 24,
        status: 'pending',
        creation_date: '2024-01-15',
      });

      expect(loan.creationDate).toBeInstanceOf(Date);
    });

    it('should handle string numbers', () => {
      const loan = Loan.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        loan_type: 'corriente',
        approved_amount: '10000',
        disbursed_amount: '5000',
        outstanding_balance: '5000', // Debe ser <= disbursed_amount cuando disbursed > 0
        monthly_payment_amount: '500',
        interest_rate: '0.02',
        term: '24',
        status: 'active',
        creation_date: mockDate,
      });

      expect(loan.approvedAmount).toBe(10000);
      expect(loan.disbursedAmount).toBe(5000);
      expect(loan.outstandingBalance).toBe(5000);
    });

    it('should handle nullable guaranteedStockId', () => {
      const loan = Loan.fromPersistence({
        id: mockId,
        member_id: 'member-1',
        loan_type: 'corriente',
        approved_amount: 10000,
        disbursed_amount: 0,
        outstanding_balance: 10000,
        monthly_payment_amount: 500,
        interest_rate: 0.02,
        term: 24,
        status: 'pending',
        creation_date: mockDate,
        guaranteed_stock_id: null,
      });

      expect(loan.guaranteedStockId).toBeUndefined();
    });
  });

  describe('update method', () => {
    let loan: Loan;

    beforeEach(() => {
      loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
    });

    it('should update disbursedAmount', () => {
      // Cuando se actualiza disbursedAmount, también se debe actualizar outstandingBalance
      // para mantener la consistencia (outstanding_balance <= disbursed_amount cuando disbursed > 0)
      loan.update({ disbursedAmount: 5000, outstandingBalance: 5000 });
      expect(loan.disbursedAmount).toBe(5000);
      expect(loan.outstandingBalance).toBe(5000);
    });

    it('should update outstandingBalance', () => {
      loan.update({ outstandingBalance: 7500 });
      expect(loan.outstandingBalance).toBe(7500);
    });

    it('should update status', () => {
      loan.update({ status: LoanStatus.ACTIVE });
      expect(loan.status).toBe('active');
    });

    it('should throw error for invalid disbursedAmount', () => {
      expect(() => loan.update({ disbursedAmount: 15000 })).toThrow(
        'Disbursed amount must be between 0 and approved amount',
      );
    });

    it('should throw error for invalid outstandingBalance exceeding disbursedAmount', () => {
      // Primero actualizar ambos valores para tener un estado consistente
      loan.update({ disbursedAmount: 5000, outstandingBalance: 5000 });
      // Luego intentar actualizar outstandingBalance a un valor mayor que disbursedAmount
      expect(() => loan.update({ outstandingBalance: 6000 })).toThrow(
        'Outstanding balance cannot exceed disbursed amount',
      );
    });
  });

  describe('disburse method', () => {
    let loan: Loan;

    beforeEach(() => {
      loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
    });

    it('should disburse amount and update status to active', () => {
      loan.disburse(5000);
      expect(loan.disbursedAmount).toBe(5000);
      expect(loan.status).toBe('active');
    });

    it('should disburse partial amount', () => {
      loan.disburse(3000);
      expect(loan.disbursedAmount).toBe(3000);
    });

    it('should change status from pending to active on first disbursement', () => {
      expect(loan.status).toBe('pending');
      loan.disburse(5000);
      expect(loan.status).toBe('active');
    });

    it('should accumulate disbursements', () => {
      loan.disburse(3000);
      loan.disburse(2000);
      expect(loan.disbursedAmount).toBe(5000);
    });

    it('should update outstanding_balance when disbursing', () => {
      const initialBalance = loan.outstandingBalance; // 10000 (approvedAmount)
      loan.disburse(5000);
      expect(loan.outstandingBalance).toBe(initialBalance + 5000);
      expect(loan.outstandingBalance).toBe(15000);
    });

    it('should update outstanding_balance correctly with multiple partial disbursements', () => {
      const initialBalance = loan.outstandingBalance; // 10000
      loan.disburse(3000);
      expect(loan.outstandingBalance).toBe(initialBalance + 3000); // 13000
      loan.disburse(2000);
      expect(loan.outstandingBalance).toBe(initialBalance + 3000 + 2000); // 15000
      expect(loan.disbursedAmount).toBe(5000);
      expect(loan.outstandingBalance).toBe(15000);
    });

    it('should maintain correct outstanding_balance after disbursement and payment', () => {
      loan.disburse(10000); // Desembolso completo
      expect(loan.outstandingBalance).toBe(20000); // 10000 inicial + 10000 desembolsado
      expect(loan.disbursedAmount).toBe(10000);

      loan.recordPayment(3000, 200); // Pago de capital
      expect(loan.outstandingBalance).toBe(17000); // 20000 - 3000
      expect(loan.disbursedAmount).toBe(10000); // No cambia
    });

    it('should throw error for negative amount', () => {
      expect(() => loan.disburse(-1000)).toThrow(
        'Disbursement amount must be > 0',
      );
    });

    it('should throw error when exceeding approved amount', () => {
      loan.disburse(9000);
      expect(() => loan.disburse(2000)).toThrow(
        'Disbursement cannot exceed approved amount',
      );
    });

    it('should throw error for non-active/pending loan', () => {
      loan.update({ status: LoanStatus.PAID });
      expect(() => loan.disburse(1000)).toThrow(
        'Loan must be pending or active to disburse',
      );
    });
  });

  describe('recordPayment method', () => {
    let loan: Loan;

    beforeEach(() => {
      loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      loan.update({ status: LoanStatus.ACTIVE });
    });

    it('should record payment and reduce outstanding balance', () => {
      loan.recordPayment(400, 100);
      expect(loan.outstandingBalance).toBe(9600);
    });

    it('should only reduce principal, not interest', () => {
      const initialBalance = loan.outstandingBalance;
      loan.recordPayment(400, 100);
      expect(loan.outstandingBalance).toBe(initialBalance - 400);
    });

    it('should mark loan as paid when balance reaches zero', () => {
      loan.update({ outstandingBalance: 500 });
      loan.recordPayment(500, 0);
      expect(loan.outstandingBalance).toBe(0);
      expect(loan.status).toBe('paid');
    });

    it('should throw error for negative amounts', () => {
      expect(() => loan.recordPayment(-100, 50)).toThrow(
        'Payment amounts must be >= 0',
      );
    });

    it('should throw error when balance would become negative', () => {
      loan.update({ outstandingBalance: 100 });
      expect(() => loan.recordPayment(200, 0)).toThrow(
        'Payment cannot result in negative outstanding balance',
      );
    });

    it('should throw error for non-active loan', () => {
      loan.update({ status: LoanStatus.PAID });
      expect(() => loan.recordPayment(100, 50)).toThrow(
        'Can only record payments for active or pending loans',
      );
    });

    it('should handle floating-point precision when reducing balance', () => {
      loan.update({ outstandingBalance: 100.2 });
      loan.recordPayment(100.1, 0);
      expect(loan.outstandingBalance).toBe(0.1);
    });

    it('should mark loan as paid when remaining balance is negligible floating point residue (<= 0.001)', () => {
      loan.update({ outstandingBalance: 100.0001 });
      loan.recordPayment(100.0, 0);
      expect(loan.outstandingBalance).toBe(0);
      expect(loan.status).toBe(LoanStatus.PAID);
    });
  });

  describe('calculateInterestDue method', () => {
    it('should calculate and round interest due to 2 decimal places', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 50000000,
        monthlyPaymentAmount: 500000,
        interestRate: 0.015,
        term: 24,
      });
      loan.update({
        disbursedAmount: 45698609,
        outstandingBalance: 45698609,
        status: LoanStatus.ACTIVE,
      });

      // 45,698,609.00 * 0.015 = 685,479.135 -> rounded to 685479.14
      expect(loan.calculateInterestDue()).toBe(685479.14);
    });
  });

  describe('markAsDefaulted method', () => {
    let loan: Loan;

    beforeEach(() => {
      loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      loan.update({ status: LoanStatus.ACTIVE });
    });

    it('should mark active loan as defaulted', () => {
      loan.markAsDefaulted();
      expect(loan.status).toBe('defaulted');
    });

    it('should throw error for non-active loan', () => {
      loan.update({ status: LoanStatus.PAID });
      expect(() => loan.markAsDefaulted()).toThrow(
        'Only active loans can be marked as defaulted',
      );
    });
  });

  describe('isActive method', () => {
    it('should return true for active loan', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      loan.update({ status: LoanStatus.ACTIVE });
      expect(loan.isActive()).toBe(true);
    });

    it('should return true for pending loan', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      expect(loan.isActive()).toBe(true);
    });

    it('should return false for paid loan', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      loan.update({ status: LoanStatus.PAID });
      expect(loan.isActive()).toBe(false);
    });

    it('should return false for defaulted loan', () => {
      const loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
      loan.update({ status: LoanStatus.DEFAULTED });
      expect(loan.isActive()).toBe(false);
    });
  });

  describe('updateApprovedAmount method', () => {
    let loan: Loan;

    beforeEach(() => {
      loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
    });

    it('should update approvedAmount and outstandingBalance when disbursedAmount is 0', () => {
      loan.updateApprovedAmount(8000);
      expect(loan.approvedAmount).toBe(8000);
      expect(loan.outstandingBalance).toBe(8000);
      expect(loan.status).toBe('pending');
    });

    it('should update approvedAmount but keep outstandingBalance when disbursedAmount > 0', () => {
      loan.update({
        disbursedAmount: 3000,
        outstandingBalance: 3000,
        status: LoanStatus.PENDING,
      });
      loan.updateApprovedAmount(8000);
      expect(loan.approvedAmount).toBe(8000);
      expect(loan.disbursedAmount).toBe(3000);
      expect(loan.outstandingBalance).toBe(3000);
      expect(loan.status).toBe('pending');
    });

    it('should transition status to active when approvedAmount equals disbursedAmount', () => {
      loan.update({
        disbursedAmount: 5000,
        outstandingBalance: 5000,
        status: LoanStatus.PENDING,
      });
      loan.updateApprovedAmount(5000);
      expect(loan.approvedAmount).toBe(5000);
      expect(loan.disbursedAmount).toBe(5000);
      expect(loan.status).toBe('active');
    });

    it('should throw error when newApprovedAmount is less than disbursedAmount', () => {
      loan.update({
        disbursedAmount: 5000,
        outstandingBalance: 5000,
        status: LoanStatus.PENDING,
      });
      expect(() => loan.updateApprovedAmount(4000)).toThrow(
        'Cannot reduce approved amount ($4000) below disbursed amount ($5000)',
      );
    });

    it('should throw error when newApprovedAmount is negative', () => {
      expect(() => loan.updateApprovedAmount(-1000)).toThrow(
        'Approved amount cannot be negative',
      );
    });
  });

  describe('updateTerms method', () => {
    let loan: Loan;

    beforeEach(() => {
      loan = Loan.create({
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
      });
    });

    it('should update loanType', () => {
      loan.updateTerms({ loanType: 'agil' });
      expect(loan.loanType).toBe('agil');
    });

    it('should trim loanType', () => {
      loan.updateTerms({ loanType: '  prioritario  ' });
      expect(loan.loanType).toBe('prioritario');
    });

    it('should throw error when loanType is empty', () => {
      expect(() => loan.updateTerms({ loanType: '' })).toThrow(
        'Loan type cannot be empty',
      );
      expect(() => loan.updateTerms({ loanType: '   ' })).toThrow(
        'Loan type cannot be empty',
      );
    });

    it('should update terms and loanType together', () => {
      loan.updateTerms({
        loanType: 'prioritario',
        interestRate: 0.03,
        term: 12,
        monthlyPaymentAmount: 850,
      });
      expect(loan.loanType).toBe('prioritario');
      expect(loan.interestRate).toBe(0.03);
      expect(loan.term).toBe(12);
      expect(loan.monthlyPaymentAmount).toBe(850);
    });
  });
});
