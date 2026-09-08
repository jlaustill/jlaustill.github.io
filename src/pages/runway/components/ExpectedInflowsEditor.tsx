import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { IExpectedInflow } from '../types/IRunwayData';

interface IExpectedInflowsEditorProps {
  items: IExpectedInflow[];
  onChange: (items: IExpectedInflow[]) => void;
}

const expectedInflowsSchema = Yup.object({
  entries: Yup.array(
    Yup.object({
      name: Yup.string().required('Name is required'),
      amount: Yup.number().required('Amount is required'),
      date: Yup.string().nullable(),
    }),
  ),
});

const ExpectedInflowsEditor = ({ items, onChange }: IExpectedInflowsEditorProps) => {
  return (
    <Formik
      initialValues={{ entries: items }}
      validationSchema={expectedInflowsSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values, handleBlur, setFieldValue }) => (
        <Form>
          <Typography variant="h6">Expected Inflows</Typography>
          <FieldArray name="entries">
            {({ push, remove }) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {values.entries.map((entry, index) => (
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
                      size="small"
                      type="date"
                      name={`entries.${index}.date`}
                      value={entry.date ?? ''}
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
                    const next = { name: '', amount: 0, date: null };
                    push(next);
                    onChange([...values.entries, next]);
                  }}
                >
                  Add Expected Inflow
                </Button>
              </Box>
            )}
          </FieldArray>
        </Form>
      )}
    </Formik>
  );
};

export default ExpectedInflowsEditor;
