import type { IRunwayData } from '../types/IRunwayData';

const REQUIRED_ARRAY_FIELDS: (keyof IRunwayData)[] = [
  'cashOnHand',
  'expectedInflows',
  'payments',
  'deposits',
];

export function parseRunwayData(text: string): IRunwayData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const data = parsed as Partial<IRunwayData>;
  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(data[field])) {
      throw new Error(`Invalid runway.json: "${field}" must be an array.`);
    }
  }

  return data as IRunwayData;
}

export function serializeRunwayData(data: IRunwayData): string {
  return JSON.stringify(data, null, 2);
}
