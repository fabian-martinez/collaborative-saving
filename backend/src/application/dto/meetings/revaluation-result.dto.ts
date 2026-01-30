export class RevaluationDetailDto {
  stockId: string;
  name: string;
  isGuaranteed: boolean;
  totalShares: number;
  previousValue: number;
  growthFromContributions: number;
  growthFromInterest: number;
  totalGrowthPerShare: number;
  estimatedGrowthFromContributions: number;
  newValue: number;
  dividendsGenerated?: number;
}

export class MandatoryContributionByTypeDto {
  mandatoryContributionId: string;
  total: number;
}

export class RevaluationResultDto {
  totalContributions: number;
  totalInterest: number;
  totalToDistribute: number;
  details: RevaluationDetailDto[];
  totalMandatoryContributions: number;
  mandatoryContributionsByType?: MandatoryContributionByTypeDto[];
  status: 'preview' | 'executed';
  executedAt?: string;
  operationId?: string;
}
