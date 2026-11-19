import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Button, Grid, IconButton, InputAdornment, TextField, Typography, type TextFieldProps } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { isDebtType } from '../engine/debt';
import { paymentTypeLabel } from '../format';
import type { IPayment, IPaymentPlan } from '../types/IRunwayData';
import { fieldError } from './fieldError';
import { numberOrZero, parseNumber } from './fieldValues';

interface IPaymentsEditorProps {
  items: IPayment[];
  onChange: (items: IPayment[]) => void;
}

const PAYMENT_TYPES = [
  'utility',
  'insurance',
  'living',
  'subscription',
  'creditCard',
  'personalLoan',
  'unsecured',
  'secured',
  'mortgage',
  'collection',
];

type TOptionalNumberField = 'balance' | 'interestRate' | 'escrow';

const paymentsSchema = Yup.object({
  entries: Yup.array(
    Yup.object({
      name: Yup.string().required('Name is required'),
      amount: Yup.number().required('Amount is required'),
      day: Yup.number().min(1, 'Day must be 1 to 31').max(31, 'Day must be 1 to 31').required('Day is required'),
      creditor: Yup.string().optional(),
      note: Yup.string().optional(),
      balance: Yup.number().optional(),
      interestRate: Yup.number().optional(),
      escrow: Yup.number().optional(),
    }),
  ),
});

const dollars = {
  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
  inputLabel: { shrink: true },
};
const percent = {
  input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
  inputLabel: { shrink: true },
};

function describePlan(plan: IPaymentPlan): string | null {
  if (!Array.isArray(plan.dueDates) || plan.dueDates.length === 0) {
    return null;
  }
  const dueDates = [...plan.dueDates].sort();
  const count = dueDates.length;
  const dates = `${count} date${count === 1 ? '' : 's'}, last ${dueDates[count - 1]}`;
  if (typeof plan.amount !== 'number' || !Number.isFinite(plan.amount)) {
    return `Plan: amount missing, ${dates}`;
  }
  return `Plan: $${plan.amount.toFixed(2)} on ${dates}`;
}

// A blank type removes the key rather than storing an empty string.
function withType(payment: IPayment, type: string): IPayment {
  const next = { ...payment };
  if (type === '') {
    delete next.type;
  } else {
    next.type = type;
  }
  return next;
}

const PaymentsEditor = ({ items, onChange }: IPaymentsEditorProps) => {
  return (
    <Formik
      initialValues={{ entries: items }}
      validationSchema={paymentsSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values, errors, touched, handleBlur, setFieldValue }) => {
        const commitOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          handleBlur(e);
          onChange(values.entries);
        };

        // Balance, interest rate and escrow left blank remove the key, so the engine reports the
        // value as missing. A blank balance must never become 0: that reads as paid off.
        const optionalNumberField = (
          index: number,
          field: TOptionalNumberField,
          label: string,
          adornment: TextFieldProps['slotProps'],
        ) => (
          <Field
            as={TextField}
            size="small"
            fullWidth
            type="number"
            label={label}
            name={`entries.${index}.${field}`}
            value={values.entries[index][field] ?? ''}
            slotProps={adornment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue(`entries.${index}.${field}`, parseNumber(e.target.value) ?? undefined);
            }}
            onBlur={commitOnBlur}
          />
        );

        return (
          <Form>
            <Typography variant="h6" gutterBottom>
              Payments &amp; Debts
            </Typography>
            <FieldArray name="entries">
              {({ push, remove }) => (
                <>
                  {values.entries.map((entry, index) => {
                    const typeOptions =
                      entry.type === undefined || entry.type === '' || PAYMENT_TYPES.includes(entry.type)
                        ? PAYMENT_TYPES
                        : [...PAYMENT_TYPES, entry.type];
                    const planText = entry.paymentPlan ? describePlan(entry.paymentPlan) : null;
                    const debt = isDebtType(entry.type);
                    return (
                      <Grid
                        container
                        spacing={1}
                        alignItems="flex-start"
                        key={index}
                        sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
                      >
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Field
                            as={TextField}
                            size="small"
                            fullWidth
                            label="Name"
                            name={`entries.${index}.name`}
                            {...fieldError(errors, touched, `entries.${index}.name`)}
                            onBlur={commitOnBlur}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                          <Field
                            as={TextField}
                            size="small"
                            fullWidth
                            type="number"
                            label="Amount"
                            name={`entries.${index}.amount`}
                            slotProps={dollars}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue(`entries.${index}.amount`, numberOrZero(e.target.value));
                            }}
                            onBlur={commitOnBlur}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 1 }}>
                          <Field
                            as={TextField}
                            size="small"
                            fullWidth
                            type="number"
                            label="Day"
                            name={`entries.${index}.day`}
                            {...fieldError(errors, touched, `entries.${index}.day`)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue(`entries.${index}.day`, numberOrZero(e.target.value));
                            }}
                            onBlur={commitOnBlur}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            label="Type"
                            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                            value={entry.type ?? ''}
                            onChange={(event) => {
                              const type = event.target.value;
                              setFieldValue(`entries.${index}.type`, type === '' ? undefined : type);
                              onChange(values.entries.map((item, i) => (i === index ? withType(item, type) : item)));
                            }}
                          >
                            <option value="">{paymentTypeLabel(undefined)}</option>
                            {typeOptions.map((type) => (
                              <option key={type} value={type}>
                                {paymentTypeLabel(type)}
                              </option>
                            ))}
                          </TextField>
                        </Grid>
                        {debt && (
                          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                            {optionalNumberField(index, 'balance', 'Balance', dollars)}
                          </Grid>
                        )}
                        {debt && (
                          <Grid size={{ xs: 6, sm: 3, md: 1 }}>
                            {optionalNumberField(index, 'interestRate', 'Interest rate', percent)}
                          </Grid>
                        )}
                        {entry.type === 'mortgage' && (
                          <Grid size={{ xs: 6, sm: 3, md: 1 }}>
                            {optionalNumberField(index, 'escrow', 'Escrow', dollars)}
                          </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Field
                            as={TextField}
                            size="small"
                            fullWidth
                            label="Creditor"
                            name={`entries.${index}.creditor`}
                            // Controlled even when the key is absent, so a removed row's text can
                            // never linger in the row that moves up into its place
                            value={entry.creditor ?? ''}
                            onBlur={commitOnBlur}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                          <Field
                            as={TextField}
                            size="small"
                            fullWidth
                            label="Note"
                            name={`entries.${index}.note`}
                            value={entry.note ?? ''}
                            onBlur={commitOnBlur}
                          />
                        </Grid>
                        <Grid size={{ xs: 10, sm: 10, md: 3 }} sx={{ alignSelf: 'center' }}>
                          {planText && (
                            <Typography variant="body2" color="text.secondary">
                              {planText}
                            </Typography>
                          )}
                          {entry.pastDue ? (
                            <Typography variant="body2" color="error">
                              past due ${entry.pastDue.toFixed(2)}
                            </Typography>
                          ) : null}
                        </Grid>
                        <Grid size={{ xs: 2, sm: 2, md: 1 }}>
                          <IconButton
                            aria-label="Remove"
                            onClick={() => {
                              remove(index);
                              onChange(values.entries.filter((_, i) => i !== index));
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    );
                  })}
                  <Button
                    type="button"
                    startIcon={<AddIcon />}
                    sx={{ mt: 1 }}
                    onClick={() => {
                      const next: IPayment = { name: '', amount: 0, day: 1 };
                      push(next);
                      onChange([...values.entries, next]);
                    }}
                  >
                    Add Payment
                  </Button>
                </>
              )}
            </FieldArray>
          </Form>
        );
      }}
    </Formik>
  );
};

export default PaymentsEditor;
