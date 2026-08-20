export const BASIS_POINTS_TOTAL = 10_000;

export function equalAllocation(actionIds: string[]): Record<string, number> {
  if (actionIds.length === 0) return {};
  const base = Math.floor(BASIS_POINTS_TOTAL / actionIds.length);
  const remainder = BASIS_POINTS_TOTAL - base * actionIds.length;
  return Object.fromEntries(actionIds.map((id, index) => [id, base + (index === actionIds.length - 1 ? remainder : 0)]));
}

export function allocationTotal(allocation: Record<string, number>): number {
  return Object.values(allocation).reduce((sum, value) => sum + value, 0);
}

export function isValidAllocation(allocation: Record<string, number>, actionIds: string[]): boolean {
  return Object.keys(allocation).length === actionIds.length
    && actionIds.every((id) => Number.isInteger(allocation[id]) && allocation[id]! >= 0 && allocation[id]! <= BASIS_POINTS_TOTAL)
    && allocationTotal(allocation) === BASIS_POINTS_TOTAL;
}

export function updateAllocation(allocation: Record<string, number>, actionId: string, percentage: number): Record<string, number> {
  const next = Math.round(percentage * 100);
  return { ...allocation, [actionId]: Math.max(0, Math.min(BASIS_POINTS_TOTAL, next)) };
}

export function formatBasisPoints(value: number): string { return `${(value / 100).toFixed(2)}%`; }
