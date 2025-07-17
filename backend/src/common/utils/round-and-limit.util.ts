// Utilidad para redondear y limitar valores numéricos según precisión y máximo permitido
export function roundAndLimit(
  value: number,
  max: number,
  decimals: number,
): number {
  const rounded =
    Math.round((value + Number.EPSILON) * Math.pow(10, decimals)) /
    Math.pow(10, decimals);
  return Math.min(max, Math.max(-max, rounded));
}
