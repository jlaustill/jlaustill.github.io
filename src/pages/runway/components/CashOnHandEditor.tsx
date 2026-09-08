import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ICashOnHandEntry } from '../types/IRunwayData';

interface ICashOnHandEditorProps {
  items: ICashOnHandEntry[];
  onChange: (items: ICashOnHandEntry[]) => void;
}

const cashOnHandSchema = Yup.object({
  entries: Yup.array(
    Yup.object({
      name: Yup.string().required('Name is required'),
      amount: Yup.number().required('Amount is required'),
    }),
  ),
});

const CashOnHandEditor = ({ items, onChange }: ICashOnHandEditorProps) => {
  return (
    <Formik
      initialValues={{ entries: items }}
      validationSchema={cashOnHandSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values }) => (
        <Form>
          <Typography variant="h6">Cash on Hand</Typography>
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
                      onBlur={() => onChange(values.entries)}
                    />
                    <Field
                      as={TextField}
                      size="small"
                      type="number"
                      name={`entries.${index}.amount`}
                      placeholder="Amount"
                      onBlur={() => onChange(values.entries)}
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
                    const next = { name: '', amount: 0 };
                    push(next);
                    onChange([...values.entries, next]);
                  }}
                >
                  Add Account
                </Button>
              </Box>
            )}
          </FieldArray>
        </Form>
      )}
    </Formik>
  );
};

export default CashOnHandEditor;
