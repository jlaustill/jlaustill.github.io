import type { IRunwayData } from '../types/IRunwayData';

const REQUIRED_ARRAY_FIELDS = ['cashOnHand', 'payments'] as const;
const OPTIONAL_ARRAY_FIELDS = ['recurringIncome', 'expectedInflows'] as const;

const notAnArray = (field: string) => new Error(`Invalid runway.json: "${field}" must be an array.`);

// Checks only the lists the page needs, and leaves every other key exactly as it was so a save
// writes it back unchanged.
export function parseRunwayData(text: string): IRunwayData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const data = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as Record<string, unknown>;
  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(data[field])) {
      throw notAnArray(field);
    }
  }
  for (const field of OPTIONAL_ARRAY_FIELDS) {
    if (data[field] === undefined) {
      data[field] = [];
    } else if (!Array.isArray(data[field])) {
      throw notAnArray(field);
    }
  }

  return data as unknown as IRunwayData;
}

export function serializeRunwayData(data: IRunwayData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}
