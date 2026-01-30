export class InterestDistributionConfig {
  constructor(
    public readonly id: string,
    public readonly loanTypeId: string,
    public readonly stockTypeId: string,
  ) {}

  static create(data: {
    id: string;
    loanTypeId: string;
    stockTypeId: string;
  }): InterestDistributionConfig {
    return new InterestDistributionConfig(
      data.id,
      data.loanTypeId,
      data.stockTypeId,
    );
  }
}
