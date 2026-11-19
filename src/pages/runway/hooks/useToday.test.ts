import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useToday, { TODAY_CHECK_INTERVAL_MS } from './useToday';

describe('useToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves on to the new day while the page stays open', () => {
    vi.setSystemTime(new Date(2026, 10, 19, 23, 59));
    const { result } = renderHook(() => useToday());
    expect(result.current.toString()).toBe('2026-11-19');

    vi.setSystemTime(new Date(2026, 10, 21, 8, 0));
    act(() => {
      vi.advanceTimersByTime(TODAY_CHECK_INTERVAL_MS);
    });

    expect(result.current.toString()).toBe('2026-11-21');
  });

  it('looks at the date again as soon as the window is back in focus', () => {
    vi.setSystemTime(new Date(2026, 10, 19, 23, 59));
    const { result } = renderHook(() => useToday());

    vi.setSystemTime(new Date(2026, 10, 20, 7, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.toString()).toBe('2026-11-20');
  });

  // A new date object re-runs the whole projection, so the same day must keep the same object.
  it('keeps the same date while the day has not changed', () => {
    vi.setSystemTime(new Date(2026, 10, 19, 9, 0));
    const { result } = renderHook(() => useToday());
    const first = result.current;

    act(() => {
      vi.advanceTimersByTime(TODAY_CHECK_INTERVAL_MS * 3);
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current).toBe(first);
  });
});
