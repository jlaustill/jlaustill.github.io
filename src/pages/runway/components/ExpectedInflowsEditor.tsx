import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Checkbox, FormControlLabel, IconButton, TextField, Typography } from '@mui/material';
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
      amount: Yup.number().nullable(),
      date: Yup.string().nullable(),
      expectedMonth: Yup.string().nullable(),
    }),
  ),
});

// A blank field means "not known yet", which the engine never counts. It must never become 0
// or an empty string.
const blankToNull = (raw: string) => (raw === '' ? null : raw);

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
                      value={entry.amount ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const raw = e.target.value;
                        const parsed = raw === '' ? null : Number(raw);
                        setFieldValue(`entries.${index}.amount`, parsed === null || Number.isNaN(parsed) ? null : parsed);
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFieldValue(`entries.${index}.date`, blankToNull(e.target.value));
                      }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e);
                        onChange(values.entries);
                      }}
                    />
                    <Field
                      as={TextField}
                      size="small"
                      name={`entries.${index}.expectedMonth`}
                      placeholder="YYYY-MM"
                      value={entry.expectedMonth ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFieldValue(`entries.${index}.expectedMonth`, blankToNull(e.target.value));
                      }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e);
                        onChange(values.entries);
                      }}
                    />
                    <FormControlLabel
                      label="Confirmed"
                      control={
                        <Checkbox
                          size="small"
                          checked={entry.confirmed === true}
                          onChange={(event) => {
                            const confirmed = event.target.checked;
                            setFieldValue(`entries.${index}.confirmed`, confirmed);
                            onChange(values.entries.map((item, i) => (i === index ? { ...item, confirmed } : item)));
                          }}
                        />
                      }
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
                    const next: IExpectedInflow = {
                      name: '',
                      amount: null,
                      date: null,
                      expectedMonth: null,
                      confirmed: false,
                    };
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
