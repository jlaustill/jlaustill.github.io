import { useState } from 'react';
import {
  Box,
  Button,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { defaults, TCountryKey, TSectorKey, TSpectrumDefaults } from './data/defaults';

const COUNTRIES: { key: TCountryKey; flag: string; color: string }[] = [
  { key: 'us',        flag: '🇺🇸', color: '#e53935' },
  { key: 'canada',    flag: '🇨🇦', color: '#43a047' },
  { key: 'germany',   flag: '🇩🇪', color: '#fb8c00' },
  { key: 'china',     flag: '🇨🇳', color: '#00acc1' },
  { key: 'cuba',      flag: '🇨🇺', color: '#8e24aa' },
  { key: 'singapore', flag: '🇸🇬', color: '#f4511e' },
];

const SECTORS: { key: TSectorKey; label: string }[] = [
  { key: 'healthcare',            label: '🏥 Healthcare' },
  { key: 'fireAndPolice',         label: '🚒 Fire & Police' },
  { key: 'education',             label: '🎓 Education' },
  { key: 'housing',               label: '🏠 Housing' },
  { key: 'fuelProduction',        label: '⛽ Fuel Production' },
  { key: 'bankingAndFinance',     label: '🏦 Banking & Finance' },
  { key: 'transportation',        label: '🚆 Transportation' },
  { key: 'internetAndTelecom',    label: '📡 Internet & Telecom' },
  { key: 'military',              label: '🪖 Military' },
  { key: 'agriculture',           label: '🌾 Agriculture' },
  { key: 'retirementAndPensions', label: '👴 Retirement & Pensions' },
];

const ROW_BG = ['#16213e', '#0f0f23'] as const;

const EconSpectrum = () => {
  const [values, setValues] = useState<TSpectrumDefaults>(() => structuredClone(defaults));

  const handleChange = (sector: TSectorKey, country: TCountryKey, value: number) => {
    setValues(prev => ({
      ...prev,
      [sector]: { ...prev[sector], [country]: value },
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Economic Spectrum
        </Typography>
        <Button variant="outlined" onClick={() => setValues(structuredClone(defaults))}>
          Reset to Defaults
        </Button>
      </Box>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ background: '#1e1e2e' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 600, width: 180 }}>Sector</TableCell>
              {COUNTRIES.map(c => (
                <TableCell key={c.key} align="center" sx={{ color: '#fff', fontSize: '1.4rem' }}>
                  {c.flag}
                </TableCell>
              ))}
            </TableRow>
            <TableRow sx={{ background: '#111' }}>
              <TableCell sx={{ color: '#888', fontSize: '0.75rem', py: 0.5 }}>
                ← Socialist
              </TableCell>
              <TableCell
                colSpan={COUNTRIES.length}
                align="right"
                sx={{ color: '#888', fontSize: '0.75rem', py: 0.5 }}
              >
                Capitalist →
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {SECTORS.map((sector, i) => (
              <TableRow key={sector.key} sx={{ background: ROW_BG[i % 2] }}>
                <TableCell sx={{ color: '#fff', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {sector.label}
                </TableCell>
                {COUNTRIES.map(country => (
                  <TableCell key={country.key} sx={{ px: 1, py: 1 }}>
                    <Slider
                      min={0}
                      max={100}
                      value={values[sector.key][country.key]}
                      onChange={(_, val) =>
                        handleChange(sector.key, country.key, val as number)
                      }
                      sx={{ color: country.color, display: 'block' }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EconSpectrum;
