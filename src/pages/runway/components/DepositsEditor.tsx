import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { IDeposit } from '../types/IRunwayData';

interface IDepositsEditorProps {
  items: IDeposit[];
  onChange: (items: IDeposit[]) => void;
}

const depositsSchema = Yup.object({
  entries: Yup.array(
    Yup.object({
      name: Yup.string().required('Name is required'),
      amount: Yup.number().required('Amount is required'),
      frequency: Yup.string().oneOf(['weekly', 'monthly']).required(),
      day: Yup.number().required('Day is required'),
    }),
  ),
});

const DepositsEditor = ({ items, onChange }: IDepositsEditorProps) => {
  return (
    <Formik
      initialValues={{ entries: items }}
      validationSchema={depositsSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values, handleBlur, handleChange, setFieldValue }) => (
        <Form>
          <Typography variant="h6">Deposits</Typography>
          <FieldArray name="entries">
            {({ push, remove }) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {values.entries.map((_entry, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                      select
                      SelectProps={{ native: true }}
                      size="small"
                      label="Frequency"
                      name={`entries.${index}.frequency`}
                      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                        handleChange(event);
                        const next = values.entries.map((item, i) =>
                          i === index ? { ...item, frequency: event.target.value as 'weekly' | 'monthly' } : item,
                        );
                        onChange(next);
                      }}
                    >
                      <option value="weekly">weekly</option>
                      <option value="monthly">monthly</option>
                    </Field>
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
                    const next: IDeposit = { name: '', amount: 0, frequency: 'monthly', day: 1 };
                    push(next);
                    onChange([...values.entries, next]);
                  }}
                >
                  Add Deposit
                </Button>
              </Box>
            )}
          </FieldArray>
        </Form>
      )}
    </Formik>
  );
};

export default DepositsEditor;
