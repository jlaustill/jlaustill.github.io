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
      {({ values, handleBlur }) => {
        const total = values.entries.reduce((sum, entry) => sum + entry.amount, 0);
        return (
          <Form>
            <Typography variant="h6">Cash on Hand</Typography>
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
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          handleBlur(e);
                          onChange(values.entries);
                        }}
                      />
                      {entry.institution && (
                        <Typography variant="body2" color="text.secondary">
                          {entry.institution}
                        </Typography>
                      )}
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
            <Typography sx={{ mt: 1 }}>Total: ${total.toFixed(2)}</Typography>
          </Form>
        );
      }}
    </Formik>
  );
};

export default CashOnHandEditor;
