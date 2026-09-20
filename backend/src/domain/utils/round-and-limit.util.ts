export function roundAndLimit(
  value: number,
  max: number,
  decimals: number,
): number {
  const factor = Math.pow(10, decimals);
  const sign = value < 0 ? -1 : 1;
  const rounded =
    sign * (Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor);
  return Math.min(max, Math.max(-max, rounded));
}
