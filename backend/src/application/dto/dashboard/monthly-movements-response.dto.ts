export class MonthlyMovementDto {
  label: string;
  collected: number;
  disbursed: number;
}

export class GetMonthlyMovementsResponseDto {
  movements: MonthlyMovementDto[];
}
