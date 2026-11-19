import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Button, Checkbox, FormControlLabel, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { IExpectedInflow } from '../types/IRunwayData';
import { fieldError } from './fieldError';
import { blankToNull, parseNumber } from './fieldValues';

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

const shrunk = { inputLabel: { shrink: true } };
const dollars = {
  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
  inputLabel: { shrink: true },
};

// A blank field means "not known yet", which the engine never counts. It must never become 0
// or an empty string.
const ExpectedInflowsEditor = ({ items, onChange }: IExpectedInflowsEditorProps) => {
  return (
    <Formik
      initialValues={{ entries: items }}
      validationSchema={expectedInflowsSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values, errors, touched, handleBlur, setFieldValue }) => {
        const commitOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          handleBlur(e);
          onChange(values.entries);
        };
        return (
          <Form>
            <Typography variant="h6" gutterBottom>
              Expected Inflows
            </Typography>
            <FieldArray name="entries">
              {({ push, remove }) => (
                <>
                  {values.entries.map((entry, index) => (
                    <Grid container spacing={1} alignItems="flex-start" key={index} sx={{ mb: 1 }}>
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
                          value={entry.amount ?? ''}
                          slotProps={dollars}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue(`entries.${index}.amount`, parseNumber(e.target.value));
                          }}
                          onBlur={commitOnBlur}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <Field
                          as={TextField}
                          size="small"
                          fullWidth
                          type="date"
                          label="Date"
                          name={`entries.${index}.date`}
                          value={entry.date ?? ''}
                          slotProps={shrunk}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue(`entries.${index}.date`, blankToNull(e.target.value));
                          }}
                          onBlur={commitOnBlur}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Field
                          as={TextField}
                          size="small"
                          fullWidth
                          label="Expected month"
                          placeholder="YYYY-MM"
                          name={`entries.${index}.expectedMonth`}
                          value={entry.expectedMonth ?? ''}
                          slotProps={shrunk}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue(`entries.${index}.expectedMonth`, blankToNull(e.target.value));
                          }}
                          onBlur={commitOnBlur}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 3, md: 2 }}>
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
                  ))}
                  <Button
                    type="button"
                    startIcon={<AddIcon />}
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
                </>
              )}
            </FieldArray>
          </Form>
        );
      }}
    </Formik>
  );
};

export default ExpectedInflowsEditor;
