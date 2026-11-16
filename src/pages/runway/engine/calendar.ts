import { Temporal } from '@js-temporal/polyfill';

// The first occurrence of `day` on or after `onOrAfter`, clamped to the length of short months.
export function getNextMonthlyDate(day: number, onOrAfter: Temporal.PlainDate): Temporal.PlainDate {
  const inMonth = (month: Temporal.PlainDate) => month.with({ day: Math.min(day, month.daysInMonth) });
  const thisMonth = inMonth(onOrAfter);
  if (Temporal.PlainDate.compare(thisMonth, onOrAfter) >= 0) {
    return thisMonth;
  }
  return inMonth(onOrAfter.with({ day: 1 }).add({ months: 1 }));
}

// The first ISO weekday (1 = Monday, 7 = Sunday) on or after `onOrAfter`.
export function getNextWeeklyDate(isoWeekday: number, onOrAfter: Temporal.PlainDate): Temporal.PlainDate {
  const daysUntil = (isoWeekday - onOrAfter.dayOfWeek + 7) % 7;
  return onOrAfter.add({ days: daysUntil });
}

// Only a real YYYY-MM-DD date counts. Anything else in the file (an empty string, an
// impossible day, free text) means "no date", never a crash.
export function parseIsoDate(value: unknown): Temporal.PlainDate | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  try {
    return Temporal.PlainDate.from(value, { overflow: 'reject' });
  } catch {
    return null;
  }
}

// The last day of an exact YYYY-MM month; anything looser (an approximate year, a bad month)
// is not a month.
export function lastDayOfMonth(yearMonth: unknown): Temporal.PlainDate | null {
  if (typeof yearMonth !== 'string' || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return null;
  }
  try {
    const month = Temporal.PlainYearMonth.from(yearMonth, { overflow: 'reject' });
    return month.toPlainDate({ day: month.daysInMonth });
  } catch {
    return null;
  }
}
