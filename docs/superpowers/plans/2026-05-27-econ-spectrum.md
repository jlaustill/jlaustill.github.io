# Economic Spectrum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/econ-spectrum` page with a grid of MUI Sliders showing where 6 countries fall on a capitalism ↔ socialism scale across 11 sectors, with authored defaults and user-adjustable values.

**Architecture:** Two new files (`defaults.ts` for typed data, `EconSpectrum.tsx` for the page), wired into the existing router and nav. No new dependencies — uses MUI Table + Slider which are already installed.

**Tech Stack:** React 19, TypeScript, MUI v7 (`@mui/material`), React Router v7, Vite

---

### Task 1: Create the data file

**Files:**
- Create: `src/pages/econ-spectrum/data/defaults.ts`

- [ ] **Step 1: Create the file**

```typescript
export type TCountryKey = 'us' | 'canada' | 'germany' | 'china' | 'cuba' | 'singapore';
export type TSectorKey =
  | 'healthcare'
  | 'fireAndPolice'
  | 'education'
  | 'housing'
  | 'fuelProduction'
  | 'bankingAndFinance'
  | 'transportation'
  | 'internetAndTelecom'
  | 'military'
  | 'agriculture'
  | 'retirementAndPensions';

export type TSpectrumDefaults = Record<TSectorKey, Record<TCountryKey, number>>;

// 0 = fully socialist, 100 = fully capitalist
export const defaults: TSpectrumDefaults = {
  healthcare:            { us: 85, canada: 30, germany: 20, china: 40, cuba:  5, singapore: 55 },
  fireAndPolice:         { us:  8, canada:  6, germany:  6, china:  8, cuba:  5, singapore:  6 },
  education:             { us: 55, canada: 65, germany: 75, china: 25, cuba:  5, singapore: 60 },
  housing:               { us: 80, canada: 65, germany: 55, china: 45, cuba:  5, singapore: 20 },
  fuelProduction:        { us: 80, canada: 65, germany: 70, china: 15, cuba:  5, singapore: 55 },
  bankingAndFinance:     { us: 85, canada: 70, germany: 60, china: 15, cuba:  5, singapore: 65 },
  transportation:        { us: 65, canada: 55, germany: 35, china: 15, cuba:  5, singapore: 30 },
  internetAndTelecom:    { us: 75, canada: 60, germany: 55, china: 10, cuba:  5, singapore: 50 },
  military:              { us: 30, canada:  8, germany:  8, china:  8, cuba:  5, singapore:  8 },
  agriculture:           { us: 70, canada: 60, germany: 60, china: 25, cuba:  5, singapore: 50 },
  retirementAndPensions: { us: 55, canada: 50, germany: 30, china: 25, cuba:  5, singapore: 40 },
};
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/econ-spectrum/data/defaults.ts
git commit -m "feat: add econ-spectrum default values"
```

---

### Task 2: Create the page component

**Files:**
- Create: `src/pages/econ-spectrum/EconSpectrum.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/econ-spectrum/EconSpectrum.tsx
git commit -m "feat: add EconSpectrum page component"
```

---

### Task 3: Wire up routing and navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Add lazy import and route in `src/App.tsx`**

Add the lazy import alongside the existing ones at the top:

```tsx
const EconSpectrum = lazy(() => import('./pages/econ-spectrum/EconSpectrum'));
```

Add the route inside `<Routes>`, following the same Suspense pattern as KfaTranslator:

```tsx
<Route
  path="/econ-spectrum"
  element={
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <EconSpectrum />
    </Suspense>
  }
/>
```

The full updated `src/App.tsx`:

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import BlogList from './pages/blog/BlogList';
import BlogPost from './pages/blog/BlogPost';
import CompoundTurboCalculator from './pages/turbo-calculator/CompoundTurboCalculator';

const KfaTranslator = lazy(() => import('./pages/kfa/KfaTranslator'));
const KfaRaven = lazy(() => import('./pages/kfa/examples/KfaRaven'));
const EconSpectrum = lazy(() => import('./pages/econ-spectrum/EconSpectrum'));

const App = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:postNumber" element={<BlogPost />} />
        <Route path="/turbo-calculator" element={<CompoundTurboCalculator />} />
        <Route
          path="/kfa"
          element={
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <KfaTranslator />
            </Suspense>
          }
        />
        <Route
          path="/kfa/examples/raven"
          element={
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <KfaRaven />
            </Suspense>
          }
        />
        <Route
          path="/econ-spectrum"
          element={
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <EconSpectrum />
            </Suspense>
          }
        />
      </Routes>
    </AppLayout>
  );
};

export default App;
```

- [ ] **Step 2: Add nav button in `src/components/layout/AppLayout.tsx`**

Add a nav button after the kfa button:

```tsx
<Button color="inherit" component={RouterLink} to="/econ-spectrum">
  Econ Spectrum
</Button>
```

The full updated `src/components/layout/AppLayout.tsx`:

```tsx
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ILayoutProps from '../types/ILayoutProps';

const AppLayout = ({ children }: ILayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              joSUu ostel
            </RouterLink>
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/blog">
            Blog
          </Button>
          <Button color="inherit" component={RouterLink} to="/turbo-calculator">
            Turbo Calculator
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/kfa"
            sx={{ textTransform: 'none' }}
          >
            kfa
          </Button>
          <Button color="inherit" component={RouterLink} to="/econ-spectrum">
            Econ Spectrum
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default AppLayout;
```

- [ ] **Step 3: Add card in `src/pages/Home.tsx`**

Add a fourth card in the Grid after the kfa card:

```tsx
<Grid size={{ xs: 12, md: 4 }}>
  <Card>
    <CardContent>
      <Typography variant="h5" component="h2">
        Econ Spectrum
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Capitalism vs. socialism by country and sector
      </Typography>
    </CardContent>
    <CardActions>
      <Button component={RouterLink} to="/econ-spectrum">
        View Spectrum
      </Button>
    </CardActions>
  </Card>
</Grid>
```

The full updated `src/pages/Home.tsx`:

```tsx
import { Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Blog
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Technical articles and thoughts
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/blog">
                View Blog
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Turbo Calculator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compound turbo boost ratio calculator
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/turbo-calculator">
                Open Calculator
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" sx={{ textTransform: 'none' }}>
                kfa
              </Typography>
              <Typography variant="body2" color="text.secondary">
                QWERTY phonetic alphabet translator
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/kfa">
                Open Translator
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Econ Spectrum
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capitalism vs. socialism by country and sector
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/econ-spectrum">
                View Spectrum
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
```

- [ ] **Step 4: Type-check**

```bash
npm run build
```

Expected: no TypeScript errors, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/layout/AppLayout.tsx src/pages/Home.tsx
git commit -m "feat: wire up econ-spectrum route, nav, and home card"
```

---

### Task 4: Verify in dev server

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: server starts at `http://localhost:5173` (or similar port shown in output).

- [ ] **Step 2: Check the home page**

Open `http://localhost:5173`. Confirm:
- "Econ Spectrum" card appears alongside Blog, Turbo Calculator, and kfa
- "View Spectrum" button is present

- [ ] **Step 3: Check the nav bar**

Confirm "Econ Spectrum" button appears in the top nav bar.

- [ ] **Step 4: Check the page**

Navigate to `/econ-spectrum`. Confirm:
- Grid renders with 6 country flag columns and 11 sector rows
- Alternating dark row backgrounds
- All sliders are draggable
- "Reset to Defaults" button restores slider positions after adjusting them
- `← Socialist` and `Capitalist →` axis labels are visible
- White text is readable on both row background colors

- [ ] **Step 5: Add `.superpowers/` to `.gitignore` if not already present**

```bash
grep -q '.superpowers' /home/linux/code/jlaustill.github.io/.gitignore || echo '.superpowers/' >> /home/linux/code/jlaustill.github.io/.gitignore
```

Then commit if changed:

```bash
git add .gitignore
git diff --cached --quiet || git commit -m "chore: ignore .superpowers brainstorm dir"
```
