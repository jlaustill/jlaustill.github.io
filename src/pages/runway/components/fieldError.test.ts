import { describe, expect, it } from 'vitest';
import { fieldError } from './fieldError';

const errors = { entries: [{ name: 'Name is required' }] };

describe('fieldError', () => {
  it('shows a field error once the field has been left', () => {
    expect(fieldError(errors, { entries: [{ name: true }] }, 'entries.0.name')).toEqual({
      error: true,
      helperText: 'Name is required',
    });
  });

  it('stays quiet before the field has been left', () => {
    expect(fieldError(errors, {}, 'entries.0.name')).toEqual({ error: false });
  });

  it('stays quiet for a touched field with no error', () => {
    expect(fieldError({}, { entries: [{ name: true }] }, 'entries.0.name')).toEqual({ error: false });
  });

  it('can keep a helper text that shows when there is no error', () => {
    expect(fieldError({}, {}, 'entries.0.days', 'e.g. 1, 15')).toEqual({ error: false, helperText: 'e.g. 1, 15' });
  });
});
