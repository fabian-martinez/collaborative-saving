import { InterestDistributionConfig } from '../../entities/interest-distribution-config.entity';

export interface InterestDistributionConfigRepository {
  findAll(): Promise<InterestDistributionConfig[]>;
  findByLoanType(loanTypeId: string): Promise<InterestDistributionConfig[]>;
  findByStockType(stockTypeId: string): Promise<InterestDistributionConfig[]>;
  save(config: InterestDistributionConfig): Promise<InterestDistributionConfig>;
  delete(id: string): Promise<void>;
}
