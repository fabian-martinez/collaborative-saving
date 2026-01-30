import { CreateLoanTypeUseCase, CreateLoanTypeCommand } from './create-loan-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';
import { LoanType, AmortizationType } from '@domain/entities/loan-type.entity';

describe('CreateLoanTypeUseCase', () => {
  let useCase: CreateLoanTypeUseCase;
  let loanTypeRepository: jest.Mocked<LoanTypeRepository>;

  beforeEach(() => {
    loanTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<LoanTypeRepository>;

    useCase = new CreateLoanTypeUseCase(loanTypeRepository);
  });

  it('should create and save a new loan type', async () => {
    const command: CreateLoanTypeCommand = {
      name: 'Test Loan Type',
      defaultApprovedAmount: 1000,
      defaultInterestRate: 0.05,
      defaultTerm: 12,
      amortizationType: AmortizationType.FRENCH,
    };

    const savedLoanType = LoanType.create({
      id: 'generated-uuid',
      ...command,
    });

    loanTypeRepository.save.mockResolvedValue(savedLoanType);

    const result = await useCase.execute(command);

    expect(loanTypeRepository.save).toHaveBeenCalledTimes(1);
    expect(loanTypeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: command.name,
        defaultApprovedAmount: command.defaultApprovedAmount,
        defaultInterestRate: command.defaultInterestRate,
        defaultTerm: command.defaultTerm,
        amortizationType: command.amortizationType,
      })
    );
    expect(result).toEqual(savedLoanType);
  });
});
