export class StockTypeResponseDto {
  id: string;
  name: string;
  behavior: string;
  isGuaranteed: boolean;
  guaranteedYield: number | null;
}