import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Grid,
  Box,
  Slider,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface IChartDataPoint {
  atmosphericBoost: number;
  atmosphericRatio: number;
  primaryRatio: number;
  totalPressure: number;
}

const CompoundTurboCalculator = () => {
  const [ambientPressure, setAmbientPressure] = useState(14.7);
  const [atmosphericBoost, setAtmosphericBoost] = useState(10);
  const [primaryBoost, setPrimaryBoost] = useState(15);

  const [atmosphericRatio, setAtmosphericRatio] = useState(0);
  const [primaryRatio, setPrimaryRatio] = useState(0);
  const [chartData, setChartData] = useState<IChartDataPoint[]>([]);

  useEffect(() => {
    const atmRatio = (ambientPressure + atmosphericBoost) / ambientPressure;
    const primRatio =
      (ambientPressure + atmosphericBoost + primaryBoost) /
      (ambientPressure + atmosphericBoost);

    setAtmosphericRatio(atmRatio);
    setPrimaryRatio(primRatio);

    const dataPoints = 15;
    const newChartData: IChartDataPoint[] = [];
    const maxAtmBoost = Math.max(atmosphericBoost * 1.5, 1);

    for (let i = 0; i <= dataPoints; i++) {
      const atmBoost = (maxAtmBoost * i) / dataPoints;
      const atmRatioPoint = (ambientPressure + atmBoost) / ambientPressure;
      const primRatioPoint =
        (ambientPressure + atmBoost + primaryBoost) /
        (ambientPressure + atmBoost);

      newChartData.push({
        atmosphericBoost: parseFloat(atmBoost.toFixed(2)),
        atmosphericRatio: parseFloat(atmRatioPoint.toFixed(3)),
        primaryRatio: parseFloat(primRatioPoint.toFixed(3)),
        totalPressure: parseFloat(
          (ambientPressure + atmBoost + primaryBoost).toFixed(2)
        ),
      });
    }
    setChartData(newChartData);
  }, [ambientPressure, atmosphericBoost, primaryBoost]);

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Compound Turbo Boost Ratio Calculator
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <TextField
              label="Ambient Pressure (PSIA)"
              type="number"
              fullWidth
              value={ambientPressure}
              onChange={(e) => setAmbientPressure(parseFloat(e.target.value))}
              slotProps={{ htmlInput: { min: 1, step: 0.1 } }}
              helperText="Standard sea level: 14.7 PSIA"
              sx={{ mb: 2 }}
            />
            <Slider
              value={ambientPressure}
              onChange={(_, value) => setAmbientPressure(value as number)}
              min={5}
              max={20}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <TextField
              label="Atmospheric Turbo Boost (PSI)"
              type="number"
              fullWidth
              value={atmosphericBoost}
              onChange={(e) => setAtmosphericBoost(parseFloat(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              sx={{ mb: 2 }}
            />
            <Slider
              value={atmosphericBoost}
              onChange={(_, value) => setAtmosphericBoost(value as number)}
              min={0}
              max={50}
              step={0.5}
              valueLabelDisplay="auto"
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <TextField
              label="Primary Turbo Boost (PSI)"
              type="number"
              fullWidth
              value={primaryBoost}
              onChange={(e) => setPrimaryBoost(parseFloat(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              sx={{ mb: 2 }}
            />
            <Slider
              value={primaryBoost}
              onChange={(_, value) => setPrimaryBoost(value as number)}
              min={0}
              max={50}
              step={0.5}
              valueLabelDisplay="auto"
            />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <Typography variant="h6" gutterBottom>
              Atmospheric Turbo
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Inlet Pressure:
                </Typography>
                <Typography variant="body1">
                  {ambientPressure.toFixed(2)} PSIA
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Outlet Pressure:
                </Typography>
                <Typography variant="body1">
                  {(ambientPressure + atmosphericBoost).toFixed(2)} PSIA
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Boost Created:
                </Typography>
                <Typography variant="body1">
                  {atmosphericBoost.toFixed(2)} PSI
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Pressure Ratio:
                </Typography>
                <Typography variant="body1">
                  {atmosphericRatio.toFixed(3)}:1
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }} variant="outlined">
            <Typography variant="h6" gutterBottom>
              Primary Turbo
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Inlet Pressure:
                </Typography>
                <Typography variant="body1">
                  {(ambientPressure + atmosphericBoost).toFixed(2)} PSIA
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Outlet Pressure:
                </Typography>
                <Typography variant="body1">
                  {(ambientPressure + atmosphericBoost + primaryBoost).toFixed(
                    2
                  )}{' '}
                  PSIA
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Boost Created:
                </Typography>
                <Typography variant="body1">
                  {primaryBoost.toFixed(2)} PSI
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Pressure Ratio:
                </Typography>
                <Typography variant="body1">
                  {primaryRatio.toFixed(3)}:1
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
        <Typography variant="h6" gutterBottom>
          Effect of Atmospheric Boost on Primary Turbo Ratio
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="atmosphericBoost"
                label={{
                  value: 'Atmospheric Boost (PSI)',
                  position: 'insideBottom',
                  offset: -5,
                }}
              />
              <YAxis
                label={{
                  value: 'Pressure Ratio',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip formatter={(value) => Number(value).toFixed(3)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="atmosphericRatio"
                name="Atmospheric Turbo Ratio"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="primaryRatio"
                name="Primary Turbo Ratio"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This chart demonstrates how the primary turbo's pressure ratio
          decreases as the atmospheric turbo creates more boost. When the
          atmospheric turbo isn't producing any boost, the primary turbo has its
          highest pressure ratio.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }} variant="outlined">
        <Typography variant="h6" gutterBottom>
          Total System Performance
        </Typography>
        <Grid container spacing={2}>
          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              Total Boost:
            </Typography>
            <Typography variant="body1">
              {(atmosphericBoost + primaryBoost).toFixed(2)} PSI
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              Total Pressure:
            </Typography>
            <Typography variant="body1">
              {(ambientPressure + atmosphericBoost + primaryBoost).toFixed(2)}{' '}
              PSIA
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              Overall System Ratio:
            </Typography>
            <Typography variant="body1">
              {(
                (ambientPressure + atmosphericBoost + primaryBoost) /
                ambientPressure
              ).toFixed(3)}
              :1
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Paper>
  );
};

export default CompoundTurboCalculator;
