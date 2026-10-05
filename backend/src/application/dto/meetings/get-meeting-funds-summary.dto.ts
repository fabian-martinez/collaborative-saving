/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface LoanCollectedThisMeetingDto {
  principal: number;
  interest: number;
  total: number;
}

export interface LoanFundSummaryDto {
  loanType: string;
  loanTypeName: string;
  outstandingBalance: number;
  collectedThisMeeting: LoanCollectedThisMeetingDto;
  activeCount: number;
}

export interface StockFundSummaryDto {
  stockId: string;
  stockName: string;
  stockType: string;
  isGuaranteed: boolean;
  totalShares: number;
  shareValue: number;
  totalValue: number;
  activeSubscriptionsCount: number;
}

export interface MeetingFundsSummaryDto {
  meetingId?: string;
  loansByType: LoanFundSummaryDto[];
  stocksByType: StockFundSummaryDto[];
}

export type GetMeetingFundsSummaryDto = MeetingFundsSummaryDto;
