export interface StockOperationResponseDto {
  operationId: string;
  message: string;
  details: Record<string, any>;
}
