import { LoanType, AmortizationType } from './loan-type.entity';

describe('LoanType Entity', () => {
  it('should create a LoanType instance using create method', () => {
    const data = {
      id: 'uuid-1',
      name: 'Corriente',
      defaultApprovedAmount: 1000,
      defaultInterestRate: 0.05,
      defaultTerm: 12,
      amortizationType: AmortizationType.FRENCH,
    };

    const loanType = LoanType.create(data);

    expect(loanType.id).toBe(data.id);
    expect(loanType.name).toBe(data.name);
    expect(loanType.defaultApprovedAmount).toBe(data.defaultApprovedAmount);
    expect(loanType.defaultInterestRate).toBe(data.defaultInterestRate);
    expect(loanType.defaultTerm).toBe(data.defaultTerm);
    expect(loanType.amortizationType).toBe(data.amortizationType);
  });

  it('should be an instance of LoanType', () => {
    const loanType = LoanType.create({
      id: 'uuid-1',
      name: 'Corriente',
      defaultApprovedAmount: 1000,
      defaultInterestRate: 0.05,
      defaultTerm: 12,
      amortizationType: AmortizationType.FRENCH,
    });

    expect(loanType).toBeInstanceOf(LoanType);
  });
});
