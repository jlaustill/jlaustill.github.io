import { getIn } from 'formik';

// The MUI error props for one Formik field: its Yup message under the field once the field has
// been left, otherwise an optional hint.
export function fieldError(
  errors: unknown,
  touched: unknown,
  path: string,
  hint?: string,
): { error: boolean; helperText?: string } {
  const message = getIn(errors, path);
  if (getIn(touched, path) && typeof message === 'string') {
    return { error: true, helperText: message };
  }
  return hint === undefined ? { error: false } : { error: false, helperText: hint };
}
