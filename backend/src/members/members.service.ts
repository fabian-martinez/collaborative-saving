import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, In } from 'typeorm';
import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Operation } from '../operations/entities/operation.entity';
import { OperationType } from '../common/enums/operation-type.enum';
import {
  MemberDetailResponseDto,
  MemberSummaryResponseDto,
  MemberStocksResponseDto,
  MemberLoansResponseDto,
  DebtCapacityResponseDto,
  StockTransactionHistoryDto,
  LoanInstallmentsDto,
  MemberTransactionsResponseDto,
} from './dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    @InjectRepository(StockSubscription)
    private readonly stockSubscriptionRepository: Repository<StockSubscription>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {}

  create(createMemberDto: CreateMemberDto): Promise<Member> {
    const member = this.membersRepository.create(createMemberDto);
    return this.membersRepository.save(member);
  }

  findAll(): Promise<Member[]> {
    return this.membersRepository.find();
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.membersRepository.findOneBy({ id });
    if (!member) {
      throw new NotFoundException(`Member #${id} not found`);
    }
    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.membersRepository.preload({
      id,
      ...updateMemberDto,
    });
    if (!member) {
      throw new NotFoundException(`Member #${id} not found`);
    }
    return this.membersRepository.save(member);
  }

  async remove(id: string): Promise<void> {
    const result = await this.membersRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Member #${id} not found`);
    }
  }

  findDeleted(): Promise<Member[]> {
    return this.membersRepository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
    });
  }

  /**
   * Get member detail with all necessary information for MemberDetailView
   */
  async getMemberDetail(memberId: string): Promise<MemberDetailResponseDto> {
    const member = await this.findOne(memberId);

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      identificationNumber: member.identificationNumber,
      role: member.role,
      status: member.status,
      address: member.address,
      phone: member.phone,
      beneficiary: member.beneficiary,
      registrationDate: member.registrationDate,
    };
  }

  /**
   * Get member stocks summary using LedgerEntry for transactions
   */
  async getMemberStocks(memberId: string): Promise<MemberStocksResponseDto> {
    const member = await this.findOne(memberId);

    // Get stock subscriptions for the member
    const stockSubscriptions = await this.stockSubscriptionRepository.find({
      where: { member_id: memberId },
      relations: ['stock'],
    });

    // Note: Stock transactions are fetched separately when needed for detailed history
    // This method only provides summary information from stock subscriptions

    // Calculate stock values and contributions
    const stocks = stockSubscriptions.map((subscription) => {
      const stock = subscription.stock;
      const quantity = Number(subscription.quantity);
      const value = stock.value * quantity;

      return {
        id: stock.id,
        name: stock.type,
        quantity,
        value,
        nominalValue: stock.value,
        requiredContribution: stock.monthly_contribution || 0,
      };
    });

    const totalValue = stocks.reduce((sum, stock) => sum + stock.value, 0);
    const totalMonthlyContribution = stocks.reduce(
      (sum, stock) => sum + stock.requiredContribution,
      0,
    );

    return {
      memberId,
      memberName: member.name,
      stocks,
      totalValue,
      totalMonthlyContribution,
    };
  }

  /**
   * Get member loans summary using LedgerEntry for transactions
   */
  async getMemberLoans(memberId: string): Promise<MemberLoansResponseDto> {
    const member = await this.findOne(memberId);

    // Get loans for the member
    const loans = await this.loanRepository.find({
      where: { member_id: memberId },
    });

    // Note: Loan transactions are fetched separately when needed for detailed history
    // This method only provides summary information from loan entities

    // Map loans to DTO format
    const loanDtos = loans.map((loan) => ({
      id: loan.id,
      loanType: loan.loan_type,
      approvedAmount: Number(loan.approved_amount),
      monthlyPaymentAmount: Number(loan.monthly_payment_amount),
      outstandingBalance: Number(loan.outstanding_balance),
      interestRate: Number(loan.interest_rate),
      term: loan.term || 24,
      status: loan.status,
      creationDate: loan.creation_date,
    }));

    const totalApprovedAmount = loanDtos.reduce(
      (sum, loan) => sum + loan.approvedAmount,
      0,
    );
    const totalOutstandingBalance = loanDtos.reduce(
      (sum, loan) => sum + loan.outstandingBalance,
      0,
    );
    const totalMonthlyPayment = loanDtos.reduce(
      (sum, loan) => sum + loan.monthlyPaymentAmount,
      0,
    );

    return {
      memberId,
      memberName: member.name,
      loans: loanDtos,
      totalApprovedAmount,
      totalOutstandingBalance,
      totalMonthlyPayment,
    };
  }

  /**
   * Calculate member debt capacity using consolidated data
   */
  async calculateMemberDebtCapacity(
    memberId: string,
  ): Promise<DebtCapacityResponseDto> {
    const member = await this.findOne(memberId);

    // Get total savings (stocks value)
    const stocks = await this.getMemberStocks(memberId);
    const totalSavings = stocks.totalValue;

    // Get total credits (loans outstanding balance)
    const loans = await this.getMemberLoans(memberId);
    const totalCredits = loans.totalOutstandingBalance;

    // Calculate capacity
    const totalCapacity = totalSavings * 2; // 2x savings as maximum capacity
    const availableCapacity = Math.max(0, totalCapacity - totalCredits);
    const utilization =
      totalCapacity > 0 ? (totalCredits / totalCapacity) * 100 : 0;

    // Determine credit status
    let creditStatus: 'excellent' | 'good' | 'moderate' | 'high';
    if (utilization <= 25) creditStatus = 'excellent';
    else if (utilization <= 50) creditStatus = 'good';
    else if (utilization <= 75) creditStatus = 'moderate';
    else creditStatus = 'high';

    return {
      memberId,
      memberName: member.name,
      totalSavings,
      totalCredits,
      availableCapacity,
      totalCapacity,
      utilization,
      creditStatus,
      calculatedAt: new Date(),
    };
  }

  /**
   * Get member summary with all consolidated information
   */
  async getMemberSummary(memberId: string): Promise<MemberSummaryResponseDto> {
    const [memberDetail, stocks, loans, debtCapacity] = await Promise.all([
      this.getMemberDetail(memberId),
      this.getMemberStocks(memberId),
      this.getMemberLoans(memberId),
      this.calculateMemberDebtCapacity(memberId),
    ]);

    return {
      member: memberDetail,
      stocks,
      loans,
      debtCapacity,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get stock transaction history for StockHistoryModal
   */
  async getStockTransactionHistory(
    stockId: string,
    memberId: string,
  ): Promise<StockTransactionHistoryDto> {
    const member = await this.findOne(memberId);
    const stock = await this.stockRepository.findOneBy({ id: stockId });

    if (!stock) {
      throw new NotFoundException(`Stock #${stockId} not found`);
    }

    // Get stock transactions from LedgerEntry
    const transactions = await this.ledgerEntryRepository.find({
      where: {
        member_id: memberId,
        stock_id: stockId,
        operation: {
          type: In([
            OperationType.STOCK_FEE,
            OperationType.STOCK_WITHDRAWAL,
            OperationType.STOCK_PURCHASE,
          ]),
        },
      },
      relations: ['operation'],
      order: { created_at: 'DESC' },
    });

    // Map transactions to DTO format
    const transactionDtos = transactions.map((entry) => {
      const date = new Date(entry.created_at);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      return {
        id: entry.id,
        date: entry.created_at,
        period,
        description: entry.description || `Transacción de ${stock.type}`,
        amount: Math.abs(Number(entry.amount)),
        status: entry.amount > 0 ? 'paid' : 'pending',
        operationType: entry.operation.type,
      };
    });

    const totalAmount = transactionDtos.reduce((sum, t) => sum + t.amount, 0);

    return {
      stockId,
      stockName: stock.type,
      memberId,
      memberName: member.name,
      nominalValue: stock.value,
      requiredContribution: stock.monthly_contribution || 0,
      transactions: transactionDtos,
      totalAmount,
    };
  }

  /**
   * Get loan installments for LoanHistoryModal
   */
  async getLoanInstallments(loanId: string): Promise<LoanInstallmentsDto> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['member'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan #${loanId} not found`);
    }

    // Get loan transactions from LedgerEntry
    const transactions = await this.ledgerEntryRepository.find({
      where: {
        loan_id: loanId,
        operation: {
          type: In([
            OperationType.LOAN_PAYMENT,
            OperationType.LOAN_DISBURSEMENT,
          ]),
        },
      },
      relations: ['operation'],
      order: { created_at: 'ASC' },
    });

    // Calculate installments based on loan terms
    const term = loan.term || 24;
    const monthlyPayment = Number(loan.monthly_payment_amount);
    const totalAmount = Number(loan.approved_amount);

    // Generate installment schedule
    const installments: Array<{
      id: string;
      installmentNumber: number;
      dueDate: Date;
      paymentDate?: Date;
      principal: number;
      interest: number;
      total: number;
      status: 'paid' | 'pending';
      amountPaid?: number;
    }> = [];

    for (let i = 1; i <= term; i++) {
      const dueDate = new Date(loan.creation_date);
      dueDate.setMonth(dueDate.getMonth() + i);

      const installment: {
        id: string;
        installmentNumber: number;
        dueDate: Date;
        paymentDate?: Date;
        principal: number;
        interest: number;
        total: number;
        status: 'paid' | 'pending';
        amountPaid?: number;
      } = {
        id: `installment-${loanId}-${i}`,
        installmentNumber: i,
        dueDate,
        principal: totalAmount / term,
        interest: (totalAmount * Number(loan.interest_rate)) / 12,
        total: monthlyPayment,
        status: 'pending',
      };

      // Check if this installment was paid
      const paymentTransaction = transactions.find(
        (t) =>
          t.operation.type === OperationType.LOAN_PAYMENT &&
          new Date(t.created_at).getMonth() === dueDate.getMonth() &&
          new Date(t.created_at).getFullYear() === dueDate.getFullYear(),
      );

      if (paymentTransaction) {
        installment.paymentDate = paymentTransaction.created_at;
        installment.status = 'paid';
        installment.amountPaid = Math.abs(Number(paymentTransaction.amount));
      }

      installments.push(installment);
    }

    const paidInstallments = installments.filter((i) => i.status === 'paid');
    const pendingInstallments = installments.filter(
      (i) => i.status === 'pending',
    );

    const totalPaid = paidInstallments.reduce(
      (sum, i) => sum + (i.amountPaid || 0),
      0,
    );
    const totalPending = pendingInstallments.reduce(
      (sum, i) => sum + i.total,
      0,
    );

    return {
      loanId,
      memberId: loan.member_id,
      memberName: loan.member.name,
      loanAmount: totalAmount,
      term,
      interestRate: Number(loan.interest_rate),
      installments,
      totalPaid,
      totalPending,
      outstandingBalance: Number(loan.outstanding_balance),
    };
  }

  /**
   * Get member transactions for general transaction table
   */
  async getMemberTransactions(
    memberId: string,
  ): Promise<MemberTransactionsResponseDto> {
    const member = await this.findOne(memberId);

    try {
      console.log('🔍 getMemberTransactions called with memberId:', memberId);

      // Get member operations using the operations service
      const operationsResult = await this.operationRepository.find({
        where: { member_id: memberId },
        order: { date: 'DESC' },
      });

      console.log('📊 Operations found:', operationsResult.length);
      if (operationsResult.length > 0) {
        console.log('📋 First operation:', {
          id: operationsResult[0].id,
          type: operationsResult[0].type,
          date: operationsResult[0].date,
          description: operationsResult[0].description,
        });
      }

      if (operationsResult.length === 0) {
        console.log('⚠️ No operations found for member');
        return {
          memberId,
          memberName: member.name,
          transactions: [],
          totalTransactions: 0,
        };
      }

      // Map operations to transaction DTOs
      const transactionDtos = operationsResult.map((operation) => ({
        id: operation.id,
        date: operation.date,
        description: operation.description || `Operación de ${operation.type}`,
        operationType: operation.type,
        accountType: 'unknown',
        stockId: undefined,
        loanId: undefined,
      }));

      const totalTransactions = transactionDtos.length;

      return {
        memberId,
        memberName: member.name,
        transactions: transactionDtos,
        totalTransactions,
      };
    } catch (error) {
      console.error('Error fetching member transactions:', error);
      return {
        memberId,
        memberName: member.name,
        transactions: [],
        totalTransactions: 0,
      };
    }
  }
}
