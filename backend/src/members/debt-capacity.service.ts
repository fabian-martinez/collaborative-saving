import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { StockSubscription } from '../stock-subscriptions/entities/stock-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { DebtCapacityResponseDto } from './dto';

@Injectable()
export class DebtCapacityService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(StockSubscription)
    private readonly stockSubscriptionRepository: Repository<StockSubscription>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Calculate debt capacity for a specific member
   */
  async calculateDebtCapacity(
    memberId: string,
  ): Promise<DebtCapacityResponseDto> {
    // Get member
    const member = await this.membersRepository.findOneBy({ id: memberId });
    if (!member) {
      throw new Error(`Member #${memberId} not found`);
    }

    // Get total savings (stocks value)
    const stockSubscriptions = await this.stockSubscriptionRepository.find({
      where: { member_id: memberId },
      relations: ['stock'],
    });

    const totalSavings = stockSubscriptions.reduce((sum, subscription) => {
      const stock = subscription.stock;
      const quantity = Number(subscription.quantity);
      const value = stock.value * quantity;
      return sum + value;
    }, 0);

    // Get total credits (loans outstanding balance)
    const loans = await this.loanRepository.find({
      where: { member_id: memberId, status: 'active' },
    });

    const totalCredits = loans.reduce((sum, loan) => {
      return sum + Number(loan.outstanding_balance);
    }, 0);

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
   * Get debt capacity summary for multiple members
   */
  async getDebtCapacitySummary(
    memberIds: string[],
  ): Promise<DebtCapacityResponseDto[]> {
    const capacities = await Promise.all(
      memberIds.map((id) => this.calculateDebtCapacity(id)),
    );

    return capacities;
  }

  /**
   * Get debt capacity statistics for the entire organization
   */
  async getOrganizationDebtCapacityStats(): Promise<{
    totalMembers: number;
    totalSavings: number;
    totalCredits: number;
    averageUtilization: number;
    membersByCreditStatus: {
      excellent: number;
      good: number;
      moderate: number;
      high: number;
    };
  }> {
    // Get all active members
    const members = await this.membersRepository.find({
      where: { status: 'active' },
    });

    const memberIds = members.map((m) => m.id);
    const capacities = await this.getDebtCapacitySummary(memberIds);

    const totalSavings = capacities.reduce((sum, c) => sum + c.totalSavings, 0);
    const totalCredits = capacities.reduce((sum, c) => sum + c.totalCredits, 0);
    const averageUtilization =
      capacities.reduce((sum, c) => sum + c.utilization, 0) / capacities.length;

    const membersByCreditStatus = {
      excellent: capacities.filter((c) => c.creditStatus === 'excellent')
        .length,
      good: capacities.filter((c) => c.creditStatus === 'good').length,
      moderate: capacities.filter((c) => c.creditStatus === 'moderate').length,
      high: capacities.filter((c) => c.creditStatus === 'high').length,
    };

    return {
      totalMembers: members.length,
      totalSavings,
      totalCredits,
      averageUtilization,
      membersByCreditStatus,
    };
  }
}
