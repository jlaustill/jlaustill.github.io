// What a typed field value becomes in the data file. Each editor picks the rule that fits the
// field, so an emptied input never turns into the string '' or NaN.

// A number, or null for an empty field or text that is not a number.
export function parseNumber(raw: string): number | null {
  if (raw === '') {
    return null;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

// For required amounts and days, where an emptied field means 0.
export function numberOrZero(raw: string): number {
  return parseNumber(raw) ?? 0;
}

// For optional text, where an emptied field means "not known yet".
export function blankToNull(raw: string): string | null {
  return raw === '' ? null : raw;
}
