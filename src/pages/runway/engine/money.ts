// Every amount the engine carries is kept to whole cents, so balances never drift on float noise.
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
