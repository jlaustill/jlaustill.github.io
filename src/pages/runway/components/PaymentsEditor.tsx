import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { isDebtType } from '../engine/debt';
import type { IPayment, IPaymentPlan } from '../types/IRunwayData';

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
      day: Yup.number().min(1).max(31).required('Day is required'),
      creditor: Yup.string().optional(),
      note: Yup.string().optional(),
      balance: Yup.number().optional(),
      interestRate: Yup.number().optional(),
      escrow: Yup.number().optional(),
    }),
  ),
});

function describePlan(plan: IPaymentPlan): string | null {
  if (!Array.isArray(plan.dueDates) || plan.dueDates.length === 0) {
    return null;
  }
  const dueDates = [...plan.dueDates].sort();
  const count = dueDates.length;
  return `Plan: $${Number(plan.amount).toFixed(2)} on ${count} date${count === 1 ? '' : 's'}, last ${dueDates[count - 1]}`;
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
      {({ values, handleBlur, setFieldValue }) => {
        const commitOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          handleBlur(e);
          onChange(values.entries);
        };

        // Balance, interest rate and escrow left blank remove the key, so the engine reports the
        // value as missing. A blank balance must never become 0: that reads as paid off.
        const optionalNumberField = (index: number, field: TOptionalNumberField, placeholder: string) => (
          <Field
            as={TextField}
            size="small"
            type="number"
            name={`entries.${index}.${field}`}
            placeholder={placeholder}
            value={values.entries[index][field] ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              const parsed = raw === '' ? undefined : Number(raw);
              setFieldValue(`entries.${index}.${field}`, parsed === undefined || Number.isNaN(parsed) ? undefined : parsed);
            }}
            onBlur={commitOnBlur}
          />
        );

        return (
          <Form>
            <Typography variant="h6">Payments &amp; Debts</Typography>
            <FieldArray name="entries">
              {({ push, remove }) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {values.entries.map((entry, index) => {
                    const typeOptions =
                      entry.type === undefined || entry.type === '' || PAYMENT_TYPES.includes(entry.type)
                        ? PAYMENT_TYPES
                        : [...PAYMENT_TYPES, entry.type];
                    const planText = entry.paymentPlan ? describePlan(entry.paymentPlan) : null;
                    return (
                      <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Field
                          as={TextField}
                          size="small"
                          name={`entries.${index}.name`}
                          placeholder="Name"
                          onBlur={commitOnBlur}
                        />
                        <Field
                          as={TextField}
                          size="small"
                          type="number"
                          name={`entries.${index}.amount`}
                          placeholder="Amount"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const raw = e.target.value;
                            const parsed = raw === '' ? 0 : Number(raw);
                            setFieldValue(`entries.${index}.amount`, Number.isNaN(parsed) ? 0 : parsed);
                          }}
                          onBlur={commitOnBlur}
                        />
                        <Field
                          as={TextField}
                          size="small"
                          type="number"
                          name={`entries.${index}.day`}
                          placeholder="Day"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const raw = e.target.value;
                            const parsed = raw === '' ? 0 : Number(raw);
                            setFieldValue(`entries.${index}.day`, Number.isNaN(parsed) ? 0 : parsed);
                          }}
                          onBlur={commitOnBlur}
                        />
                        <TextField
                          select
                          size="small"
                          slotProps={{ select: { native: true } }}
                          value={entry.type ?? ''}
                          onChange={(event) => {
                            const type = event.target.value;
                            setFieldValue(`entries.${index}.type`, type === '' ? undefined : type);
                            onChange(values.entries.map((item, i) => (i === index ? withType(item, type) : item)));
                          }}
                        >
                          <option value="">(no type)</option>
                          {typeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </TextField>
                        {isDebtType(entry.type) && optionalNumberField(index, 'balance', 'Balance')}
                        {isDebtType(entry.type) && optionalNumberField(index, 'interestRate', 'Interest rate')}
                        {entry.type === 'mortgage' && optionalNumberField(index, 'escrow', 'Escrow')}
                        <Field
                          as={TextField}
                          size="small"
                          name={`entries.${index}.creditor`}
                          placeholder="Creditor"
                          onBlur={commitOnBlur}
                        />
                        <Field
                          as={TextField}
                          size="small"
                          name={`entries.${index}.note`}
                          placeholder="Note"
                          sx={{ minWidth: 200 }}
                          onBlur={commitOnBlur}
                        />
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
                        <IconButton
                          aria-label="Remove"
                          onClick={() => {
                            remove(index);
                            onChange(values.entries.filter((_, i) => i !== index));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    );
                  })}
                  <Button
                    type="button"
                    onClick={() => {
                      const next: IPayment = { name: '', amount: 0, day: 1 };
                      push(next);
                      onChange([...values.entries, next]);
                    }}
                  >
                    Add Payment
                  </Button>
                </Box>
              )}
            </FieldArray>
          </Form>
        );
      }}
    </Formik>
  );
};

export default PaymentsEditor;
