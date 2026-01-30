import { GetLoanTypesQueryHandler } from './get-loan-types.query-handler';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType, AmortizationType } from '@domain/entities/loan-type.entity';

describe('GetLoanTypesQueryHandler', () => {
  let queryHandler: GetLoanTypesQueryHandler;
  let loanTypeRepository: jest.Mocked<LoanTypeRepository>;

  beforeEach(() => {
    loanTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<LoanTypeRepository>;

    queryHandler = new GetLoanTypesQueryHandler(loanTypeRepository);
  });

  it('should return all loan types from repository', async () => {
    const loanTypes: LoanType[] = [
      LoanType.create({ id: '1', name: 'Type 1', defaultApprovedAmount: 1000, defaultInterestRate: 0.1, defaultTerm: 12, amortizationType: AmortizationType.FRENCH }),
      LoanType.create({ id: '2', name: 'Type 2', defaultApprovedAmount: 2000, defaultInterestRate: 0.2, defaultTerm: 24, amortizationType: AmortizationType.GERMAN }),
    ];

    loanTypeRepository.findAll.mockResolvedValue(loanTypes);

    const result = await queryHandler.execute();

    expect(loanTypeRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(loanTypes);
  });

  it('should return empty array when no loan types exist', async () => {
    loanTypeRepository.findAll.mockResolvedValue([]);

    const result = await queryHandler.execute();

    expect(loanTypeRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
