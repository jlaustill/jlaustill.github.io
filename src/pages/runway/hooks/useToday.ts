import { useEffect, useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';

// How often the date is looked at again, so a page left open overnight moves on to the new day.
export const TODAY_CHECK_INTERVAL_MS = 60_000;

// Today's local date, kept current while the page stays open: balances are dated with it and
// the projection starts from it. The same day keeps the same object, so nothing re-renders.
export default function useToday(): Temporal.PlainDate {
  const [today, setToday] = useState(() => Temporal.Now.plainDateISO());
  useEffect(() => {
    const lookAgain = () => {
      const now = Temporal.Now.plainDateISO();
      setToday((shown) => (shown.equals(now) ? shown : now));
    };
    const timer = setInterval(lookAgain, TODAY_CHECK_INTERVAL_MS);
    window.addEventListener('focus', lookAgain);
    document.addEventListener('visibilitychange', lookAgain);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', lookAgain);
      document.removeEventListener('visibilitychange', lookAgain);
    };
  }, []);
  return today;
}
