export interface RevaluationDetail {
  stock_id: string;
  type: string;
  is_guaranteed: boolean;
  total_shares: number;
  previous_value: number;
  growth_from_contributions: number;
  growth_from_interest: number;
  total_growth_per_share: number;
  estimated_growth_from_contributions: number;
  new_value: number;
}

export interface RevaluationPreviewResult {
  total_contributions: number;
  total_interest: number;
  total_to_distribute: number;
  details: RevaluationDetail[];
  total_mandatory_contributions: number;
  mandatory_contributions_by_type?: Array<{
    total: number;
    mandatory_contribution_id: string;
  }>;
}
