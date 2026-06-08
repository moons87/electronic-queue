const FALLBACK_SERVICE_MIN = 5;

export function estimateWaitMinutes(
  ahead: number,
  avgServiceMin: number | null,
): number {
  const avg = avgServiceMin && avgServiceMin > 0 ? avgServiceMin : FALLBACK_SERVICE_MIN;
  return ahead * avg;
}
