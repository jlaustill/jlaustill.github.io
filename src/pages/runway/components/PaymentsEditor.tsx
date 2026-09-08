import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { IPayment } from '../types/IRunwayData';

interface IPaymentsEditorProps {
  items: IPayment[];
  onChange: (items: IPayment[]) => void;
}

const paymentsSchema = Yup.object({
  entries: Yup.array(
    Yup.object({
      name: Yup.string().required('Name is required'),
      amount: Yup.number().required('Amount is required'),
      day: Yup.number().min(1).max(31).required('Day is required'),
      creditor: Yup.string().optional(),
      note: Yup.string().optional(),
    }),
  ),
});

const PaymentsEditor = ({ items, onChange }: IPaymentsEditorProps) => {
  return (
    <Formik
      initialValues={{ entries: items }}
      validationSchema={paymentsSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values, handleBlur, setFieldValue }) => (
        <Form>
          <Typography variant="h6">Payments &amp; Debts</Typography>
          <FieldArray name="entries">
            {({ push, remove }) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {values.entries.map((entry, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Field
                      as={TextField}
                      size="small"
                      name={`entries.${index}.name`}
                      placeholder="Name"
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e);
                        onChange(values.entries);
                      }}
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
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e);
                        onChange(values.entries);
                      }}
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
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e);
                        onChange(values.entries);
                      }}
                    />
                    <Field
                      as={TextField}
                      size="small"
                      name={`entries.${index}.creditor`}
                      placeholder="Creditor"
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e);
                        onChange(values.entries);
                      }}
                    />
                    <Field
                      as={TextField}
                      size="small"
                      name={`entries.${index}.note`}
                      placeholder="Note"
                      sx={{ minWidth: 200 }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e);
                        onChange(values.entries);
                      }}
                    />
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
                ))}
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
      )}
    </Formik>
  );
};

export default PaymentsEditor;
