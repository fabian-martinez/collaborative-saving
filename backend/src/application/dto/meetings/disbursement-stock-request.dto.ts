/**
 * Disbursement Stock Request DTO
 *
 * Request information for stock withdrawal disbursement
 */
export interface DisbursementStockRequestDto {
  stockId: string;
  stockWithdrawalQuantity?: number;
}
