export enum AmortizationType {
  FRENCH = 'french',
  GERMAN = 'german',
}

export class LoanType {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly defaultApprovedAmount: number,
    public readonly defaultInterestRate: number,
    public readonly defaultTerm: number,
    public readonly amortizationType: AmortizationType,
  ) {}

  static create(data: {
    id: string;
    name: string;
    defaultApprovedAmount: number;
    defaultInterestRate: number;
    defaultTerm: number;
    amortizationType: AmortizationType;
  }): LoanType {
    return new LoanType(
      data.id,
      data.name,
      data.defaultApprovedAmount,
      data.defaultInterestRate,
      data.defaultTerm,
      data.amortizationType,
    );
  }
}
