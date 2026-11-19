import type { Temporal } from '@js-temporal/polyfill';
import { parseIsoDate } from './engine/calendar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const wholeMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const signedMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'exceptZero' });
const editableMoney = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(amount: number): string {
  return money.format(amount);
}

export function formatWholeMoney(amount: number): string {
  return wholeMoney.format(amount);
}

export function formatSignedMoney(amount: number): string {
  return signedMoney.format(amount);
}

// What a balance field shows while it is not being typed in, e.g. "1,200.00".
export function formatMoneyInput(amount: number): string {
  return editableMoney.format(amount);
}

// Reads what was typed into a money field. Dollar signs, commas and spaces are ignored; empty or
// non-numeric text is no amount at all, never 0.
export function parseMoneyInput(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (cleaned === '') {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatShortDate(date: Temporal.PlainDate, today: Temporal.PlainDate): string {
  const short = `${MONTHS[date.month - 1]} ${date.day}`;
  return date.year === today.year ? short : `${short}, ${date.year}`;
}

export function formatLongDate(date: Temporal.PlainDate): string {
  return `${MONTHS[date.month - 1]} ${date.day}, ${date.year}`;
}

// Written out by hand: newer ICU data puts a narrow no-break space before AM/PM.
export function formatClockTime(at: Date): string {
  const hours = at.getHours();
  const minutes = String(at.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

// A balance older than this reads as stale, the cue to check it before trusting the projection.
export const STALE_AFTER_DAYS = 7;

export function describeUpdated(updatedAt: unknown, today: Temporal.PlainDate): { text: string; stale: boolean } {
  const updated = parseIsoDate(updatedAt);
  if (!updated) {
    return { text: 'Not dated', stale: true };
  }
  const days = Math.max(updated.until(today).days, 0);
  if (days === 0) {
    return { text: 'Updated today', stale: false };
  }
  if (days === 1) {
    return { text: 'Updated yesterday', stale: false };
  }
  return { text: `Updated ${days} days ago`, stale: days > STALE_AFTER_DAYS };
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  utility: 'Utility',
  insurance: 'Insurance',
  living: 'Living',
  subscription: 'Subscription',
  creditCard: 'Credit card',
  personalLoan: 'Personal loan',
  unsecured: 'Unsecured loan',
  secured: 'Secured loan',
  mortgage: 'Mortgage',
  collection: 'Collection',
};

export function paymentTypeLabel(type: string | undefined): string {
  if (!type) {
    return 'No type';
  }
  return Object.prototype.hasOwnProperty.call(PAYMENT_TYPE_LABELS, type) ? PAYMENT_TYPE_LABELS[type] : type;
}
