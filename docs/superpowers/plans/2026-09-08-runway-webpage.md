# Runway Webpage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/runway` page to this site that loads a `runway.json` file from local disk, displays and computes a projected cash-flow schedule from it, lets the user edit every field, and saves changes back to the same file — entirely client-side, no data ever leaves the browser.

**Architecture:** A new lazy-loaded React page (`RunwayPage`) guarded by a shared `useBrowserSide` hook so it renders a static skeleton during this site's build-time SSR prerender and the real interactive app only client-side. A pure `runwayEngine.ts` module (ported from the `jlaustill/runway` CLI) computes the projected schedule from an `IRunwayData` object. `Formik` (JSX component form) + `Yup` power the editing forms. A `useRunwayFile` hook wraps the File System Access API for load/save.

**Tech Stack:** React 19, TypeScript, Vite, MUI (existing); Formik + Yup (new, forms); Vitest + `@testing-library/react` + `@testing-library/user-event` (new, testing); `@js-temporal/polyfill` (new, date math).

**Spec:** `docs/superpowers/specs/2026-09-08-runway-webpage-design.md`

## Global Constraints

- Chromium-only in v1 (File System Access API) — detect and message clearly, don't attempt a fallback.
- No autosave. Saving is only ever triggered by an explicit user action (the Save button added in Task 13).
- Editing forms use Formik's **JSX component** (`<Formik>`), never the `useFormik()` hook.
- `RunwayPage` must never call browser-only APIs outside of a client-only branch guarded by `useBrowserSide()` — this site prerenders every route (including lazy ones) to real static HTML at build time via Node SSR, and `window` does not exist in that environment.
- The calculation engine uses `payments[].amount` as the real cash-flow number, never `shouldBe` — except for the one-time lump on a payment's `reinstatementDue` date, which does use `shouldBe`.
- All work happens on the `feature/runway-webpage` branch (already created off `master` in `/home/linux/code/jlaustill.github.io`). Do not push to or merge `master`.
- Every React component file ends with `export default ComponentName;` (existing repo convention). Multi-function utility modules (`runwayFileIO.ts`, `runwayEngine.ts`) use named exports instead, since a file can only have one default export and these have several co-equal functions.

---

## Task 1: Vitest test infrastructure + `useBrowserSide` hook

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test-setup.ts`
- Create: `src/hooks/useBrowserSide.ts`
- Test: `src/hooks/useBrowserSide.test.ts`
- Modify: `package.json` (add devDependencies + `test` script)

**Interfaces:**
- Produces: `useBrowserSide(): boolean` — default export from `src/hooks/useBrowserSide.ts`. Returns `true` once `window` exists (i.e., client-side), `false` during server-side prerendering.

- [ ] **Step 1: Install test dependencies**

```bash
cd /home/linux/code/jlaustill.github.io
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create the Vitest config**

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
    },
  }),
);
```

- [ ] **Step 3: Create the test setup file**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add the `test` script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run"
```

- [ ] **Step 5: Write the failing test for `useBrowserSide`**

```typescript
// src/hooks/useBrowserSide.test.ts
import { describe, it, expect, vi } from 'vitest';
import useBrowserSide from './useBrowserSide';

describe('useBrowserSide', () => {
  it('returns true when window is defined', () => {
    expect(useBrowserSide()).toBe(true);
  });

  it('returns false when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(useBrowserSide()).toBe(false);
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- useBrowserSide`
Expected: FAIL — `Cannot find module './useBrowserSide'`

- [ ] **Step 7: Implement `useBrowserSide`**

```typescript
// src/hooks/useBrowserSide.ts
function useBrowserSide(): boolean {
  return typeof window !== 'undefined';
}

export default useBrowserSide;
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- useBrowserSide`
Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts src/test-setup.ts src/hooks/ package.json package-lock.json
git commit -m "feat: add Vitest infra and useBrowserSide hook

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 2: `IRunwayData` types + `runwayFileIO` parse/serialize

**Files:**
- Create: `src/pages/runway/types/IRunwayData.ts`
- Create: `src/pages/runway/hooks/runwayFileIO.ts`
- Test: `src/pages/runway/hooks/runwayFileIO.test.ts`

**Interfaces:**
- Produces: `ICashOnHandEntry`, `IExpectedInflow`, `IPayment`, `IDeposit`, `IRunwayData` (types, from `IRunwayData.ts`).
- Produces: `parseRunwayData(text: string): IRunwayData` (throws `Error` with a human-readable message on invalid input) and `serializeRunwayData(data: IRunwayData): string` — named exports from `runwayFileIO.ts`.

- [ ] **Step 1: Create the data model types**

```typescript
// src/pages/runway/types/IRunwayData.ts
export interface ICashOnHandEntry {
  name: string;
  amount: number;
  institution?: string;
  note?: string;
}

export interface IExpectedInflow {
  name: string;
  amount: number;
  date: string | null;
  note?: string;
}

export interface IPayment {
  name: string;
  amount: number;
  shouldBe?: number;
  pastDue?: number | null;
  day: number;
  balance?: number;
  creditor?: string;
  merchant?: string;
  type?: string;
  collateral?: string | null;
  disposition?: 'keep' | 'cancel' | null;
  chargeOffDate?: string | null;
  updatedAt?: string | null;
  note?: string;
  reinstatementDue?: string;
  revertsToMonthlyPayment?: number;
}

export interface IDeposit {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  day: number;
  startDate?: string;
  endDate?: string;
  occurrences?: number;
}

export interface IRunwayData {
  cashOnHand: ICashOnHandEntry[];
  expectedInflows: IExpectedInflow[];
  payments: IPayment[];
  deposits: IDeposit[];
}
```

- [ ] **Step 2: Write the failing tests for parse/serialize**

```typescript
// src/pages/runway/hooks/runwayFileIO.test.ts
import { describe, it, expect } from 'vitest';
import { parseRunwayData, serializeRunwayData } from './runwayFileIO';
import type { IRunwayData } from '../types/IRunwayData';

const validData: IRunwayData = {
  cashOnHand: [{ name: 'Checking', amount: 100 }],
  expectedInflows: [],
  payments: [{ name: 'Rent', amount: 1000, day: 1 }],
  deposits: [],
};

describe('parseRunwayData', () => {
  it('parses valid runway.json text', () => {
    expect(parseRunwayData(JSON.stringify(validData))).toEqual(validData);
  });

  it('throws a clear error on invalid JSON', () => {
    expect(() => parseRunwayData('{not json')).toThrow('That file is not valid JSON.');
  });

  it('throws a clear error when a required array field is missing', () => {
    const broken = JSON.stringify({ cashOnHand: [], expectedInflows: [], payments: [] });
    expect(() => parseRunwayData(broken)).toThrow('"deposits" must be an array');
  });
});

describe('serializeRunwayData', () => {
  it('round-trips through parseRunwayData', () => {
    expect(parseRunwayData(serializeRunwayData(validData))).toEqual(validData);
  });

  it('pretty-prints with 2-space indentation', () => {
    expect(serializeRunwayData(validData)).toContain('\n  "cashOnHand"');
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- runwayFileIO`
Expected: FAIL — `Cannot find module './runwayFileIO'`

- [ ] **Step 4: Implement `runwayFileIO`**

```typescript
// src/pages/runway/hooks/runwayFileIO.ts
import type { IRunwayData } from '../types/IRunwayData';

const REQUIRED_ARRAY_FIELDS: (keyof IRunwayData)[] = [
  'cashOnHand',
  'expectedInflows',
  'payments',
  'deposits',
];

export function parseRunwayData(text: string): IRunwayData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const data = parsed as Partial<IRunwayData>;
  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(data[field])) {
      throw new Error(`Invalid runway.json: "${field}" must be an array.`);
    }
  }

  return data as IRunwayData;
}

export function serializeRunwayData(data: IRunwayData): string {
  return JSON.stringify(data, null, 2);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- runwayFileIO`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/pages/runway/types/ src/pages/runway/hooks/runwayFileIO.ts src/pages/runway/hooks/runwayFileIO.test.ts
git commit -m "feat: add runway data model types and JSON parse/serialize

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 3: `useRunwayFile` hook (load only)

**Files:**
- Create: `src/pages/runway/hooks/useRunwayFile.ts`
- Modify: `package.json` (add `@types/wicg-file-system-access` devDependency)

**Interfaces:**
- Consumes: `parseRunwayData` (Task 2).
- Produces: `useRunwayFile(): { data: IRunwayData | null; error: string | null; fileName: string | null; load: () => Promise<void>; setData: (data: IRunwayData) => void }` — default export.

**Note:** The File System Access API isn't available in jsdom/Node, so this hook has no automated test (matches the spec's Testing section: "not practically unit-testable"). It's exercised manually in Task 4, once `RunwayPage` exists to click through.

- [ ] **Step 1: Install File System Access API types**

```bash
npm install -D @types/wicg-file-system-access
```

If `tsc -b` later reports `showOpenFilePicker`/`createWritable` as missing on `Window`/`FileSystemFileHandle`, add `"wicg-file-system-access"` to the `"types"` array in `tsconfig.app.json`.

- [ ] **Step 2: Implement `useRunwayFile`**

```typescript
// src/pages/runway/hooks/useRunwayFile.ts
import { useCallback, useState } from 'react';
import { parseRunwayData } from './runwayFileIO';
import type { IRunwayData } from '../types/IRunwayData';

interface IUseRunwayFileResult {
  data: IRunwayData | null;
  error: string | null;
  fileName: string | null;
  load: () => Promise<void>;
  setData: (data: IRunwayData) => void;
}

function useRunwayFile(): IUseRunwayFileResult {
  const [, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [data, setDataState] = useState<IRunwayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    if (!('showOpenFilePicker' in window)) {
      setError('This tool needs a Chromium browser (Chrome, Edge, or Brave) to open local files.');
      return;
    }
    try {
      const [selectedHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Runway JSON', accept: { 'application/json': ['.json'] } }],
      });
      const file = await selectedHandle.getFile();
      const text = await file.text();
      const parsed = parseRunwayData(text);
      setHandle(selectedHandle);
      setDataState(parsed);
      setFileName(file.name);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // user cancelled the picker, not an error
      }
      setError(err instanceof Error ? err.message : 'Failed to load the file.');
    }
  }, []);

  const setData = useCallback((next: IRunwayData) => {
    setDataState(next);
  }, []);

  return { data, error, fileName, load, setData };
}

export default useRunwayFile;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: no errors. If `showOpenFilePicker` is reported as missing, follow the fallback in Step 1.

- [ ] **Step 4: Commit**

```bash
git add src/pages/runway/hooks/useRunwayFile.ts package.json package-lock.json tsconfig.app.json
git commit -m "feat: add useRunwayFile hook for loading runway.json from disk

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 4: `/runway` route, skeleton, and page shell (Phase 1 milestone)

**Files:**
- Create: `src/pages/runway/RunwaySkeleton.tsx`
- Create: `src/pages/runway/RunwayPage.tsx`
- Modify: `src/routeMeta.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

**Interfaces:**
- Consumes: `useBrowserSide` (Task 1), `useRunwayFile` (Task 3).

- [ ] **Step 1: Add the route metadata entry**

In `src/routeMeta.ts`, add to the `routeMeta` array (after the `econ-spectrum` entry):

```typescript
  {
    path: '/runway',
    title: 'Runway | joSUu ostel',
    description:
      'Personal financial runway calculator — loads and saves a local runway.json file, no data leaves your device.',
  },
```

- [ ] **Step 2: Create `RunwaySkeleton`**

```tsx
// src/pages/runway/RunwaySkeleton.tsx
import { Box, Typography, CircularProgress } from '@mui/material';

const RunwaySkeleton = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
      <Typography variant="h4">Runway</Typography>
      <CircularProgress />
    </Box>
  );
};

export default RunwaySkeleton;
```

- [ ] **Step 3: Create `RunwayPage`**

```tsx
// src/pages/runway/RunwayPage.tsx
import { Box, Button, Typography, Alert } from '@mui/material';
import useBrowserSide from '../../hooks/useBrowserSide';
import useRunwayFile from './hooks/useRunwayFile';
import RunwaySkeleton from './RunwaySkeleton';

const RunwayApp = () => {
  const { data, error, fileName, load } = useRunwayFile();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Runway
      </Typography>
      <Button variant="contained" onClick={load}>
        Open runway.json
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {fileName && (
        <Typography sx={{ mt: 2 }}>
          Loaded: {fileName} ({data?.payments.length ?? 0} payments,{' '}
          {data?.deposits.length ?? 0} deposits)
        </Typography>
      )}
    </Box>
  );
};

const RunwayPage = () => {
  const isBrowserSide = useBrowserSide();
  if (!isBrowserSide) {
    return <RunwaySkeleton />;
  }
  return <RunwayApp />;
};

export default RunwayPage;
```

- [ ] **Step 4: Wire the lazy route into `App.tsx`**

Add the lazy import near the other `lazy()` calls:

```typescript
const RunwayPage = lazy(() => import('./pages/runway/RunwayPage'));
```

Add the route inside `<Routes>`, after the `/econ-spectrum` route:

```tsx
        <Route
          path="/runway"
          element={
            <>
              <PageMeta {...getRouteMeta('/runway')} />
              <Suspense fallback={lazyFallback}>
                <RunwayPage />
              </Suspense>
            </>
          }
        />
```

- [ ] **Step 5: Add the nav button**

In `src/components/layout/AppLayout.tsx`, add after the "Econ Spectrum" button:

```tsx
          <Button color="inherit" component={RouterLink} to="/runway">
            Runway
          </Button>
```

- [ ] **Step 6: Manual test**

Create a temporary test fixture at `/tmp/runway-test.json`:

```json
{
  "cashOnHand": [{ "name": "Checking", "amount": 500 }],
  "expectedInflows": [],
  "payments": [{ "name": "Rent", "amount": 1200, "day": 1 }],
  "deposits": []
}
```

Run:
```bash
npm run dev
```

Navigate to `http://localhost:5173/runway`, click "Open runway.json", select `/tmp/runway-test.json`.

Expected: page shows "Loaded: runway-test.json (1 payments, 0 deposits)". Then run `npm run build` and confirm it completes without errors (this exercises the SSR prerender path for `/runway`, which must render only `RunwaySkeleton` without crashing).

- [ ] **Step 7: Commit**

```bash
git add src/pages/runway/RunwaySkeleton.tsx src/pages/runway/RunwayPage.tsx src/routeMeta.ts src/App.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: add /runway route with file-loading page shell

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 5: `CashOnHandEditor` (read-only)

**Files:**
- Create: `src/pages/runway/components/CashOnHandEditor.tsx`
- Test: `src/pages/runway/components/CashOnHandEditor.test.tsx`

**Interfaces:**
- Consumes: `ICashOnHandEntry` (Task 2).
- Produces: `CashOnHandEditor({ items: ICashOnHandEntry[]; onChange: (items: ICashOnHandEntry[]) => void })` — default export. `onChange` is accepted now (for Task 10) but unused until then.

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/runway/components/CashOnHandEditor.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CashOnHandEditor from './CashOnHandEditor';

describe('CashOnHandEditor', () => {
  it('renders each account and the total', () => {
    render(
      <CashOnHandEditor
        items={[
          { name: 'Checking', amount: 83.32, institution: 'Wells Fargo' },
          { name: 'Venmo', amount: 112.99 },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/Checking: \$83.32 \(Wells Fargo\)/)).toBeInTheDocument();
    expect(screen.getByText(/Venmo: \$112.99/)).toBeInTheDocument();
    expect(screen.getByText('Total: $196.31')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- CashOnHandEditor`
Expected: FAIL — `Cannot find module './CashOnHandEditor'`

- [ ] **Step 3: Implement the component**

```tsx
// src/pages/runway/components/CashOnHandEditor.tsx
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { ICashOnHandEntry } from '../types/IRunwayData';

interface ICashOnHandEditorProps {
  items: ICashOnHandEntry[];
  onChange: (items: ICashOnHandEntry[]) => void;
}

const CashOnHandEditor = ({ items }: ICashOnHandEditorProps) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box>
      <Typography variant="h6">Cash on Hand</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText
              primary={`${item.name}: $${item.amount.toFixed(2)}${
                item.institution ? ` (${item.institution})` : ''
              }`}
            />
          </ListItem>
        ))}
      </List>
      <Typography>Total: ${total.toFixed(2)}</Typography>
    </Box>
  );
};

export default CashOnHandEditor;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- CashOnHandEditor`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/runway/components/CashOnHandEditor.tsx src/pages/runway/components/CashOnHandEditor.test.tsx
git commit -m "feat: add read-only CashOnHandEditor

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 6: `ExpectedInflowsEditor` + `DepositsEditor` (read-only)

**Files:**
- Create: `src/pages/runway/components/ExpectedInflowsEditor.tsx`
- Test: `src/pages/runway/components/ExpectedInflowsEditor.test.tsx`
- Create: `src/pages/runway/components/DepositsEditor.tsx`
- Test: `src/pages/runway/components/DepositsEditor.test.tsx`

**Interfaces:**
- Consumes: `IExpectedInflow`, `IDeposit` (Task 2).
- Produces: `ExpectedInflowsEditor({ items: IExpectedInflow[]; onChange })`, `DepositsEditor({ items: IDeposit[]; onChange })` — default exports.

- [ ] **Step 1: Write the failing test for `ExpectedInflowsEditor`**

```tsx
// src/pages/runway/components/ExpectedInflowsEditor.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpectedInflowsEditor from './ExpectedInflowsEditor';

describe('ExpectedInflowsEditor', () => {
  it('shows a date when set, and "no date yet" when null', () => {
    render(
      <ExpectedInflowsEditor
        items={[
          { name: 'Progressive refund', amount: 300, date: null },
          { name: 'Tax refund', amount: 450, date: '2026-04-15' },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/Progressive refund: \$300.00 \(no date yet\)/)).toBeInTheDocument();
    expect(screen.getByText(/Tax refund: \$450.00 \(2026-04-15\)/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write the failing test for `DepositsEditor`**

```tsx
// src/pages/runway/components/DepositsEditor.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DepositsEditor from './DepositsEditor';

describe('DepositsEditor', () => {
  it('renders name, amount, and frequency', () => {
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/Paycheck: \$1500.00 \(monthly, day 25\)/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run both tests to verify they fail**

Run: `npm test -- ExpectedInflowsEditor DepositsEditor`
Expected: FAIL — modules not found

- [ ] **Step 4: Implement `ExpectedInflowsEditor`**

```tsx
// src/pages/runway/components/ExpectedInflowsEditor.tsx
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { IExpectedInflow } from '../types/IRunwayData';

interface IExpectedInflowsEditorProps {
  items: IExpectedInflow[];
  onChange: (items: IExpectedInflow[]) => void;
}

const ExpectedInflowsEditor = ({ items }: IExpectedInflowsEditorProps) => {
  return (
    <Box>
      <Typography variant="h6">Expected Inflows</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText
              primary={`${item.name}: $${item.amount.toFixed(2)} (${item.date ?? 'no date yet'})`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ExpectedInflowsEditor;
```

- [ ] **Step 5: Implement `DepositsEditor`**

```tsx
// src/pages/runway/components/DepositsEditor.tsx
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { IDeposit } from '../types/IRunwayData';

interface IDepositsEditorProps {
  items: IDeposit[];
  onChange: (items: IDeposit[]) => void;
}

const DepositsEditor = ({ items }: IDepositsEditorProps) => {
  return (
    <Box>
      <Typography variant="h6">Deposits</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText
              primary={`${item.name}: $${item.amount.toFixed(2)} (${item.frequency}, day ${item.day})`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DepositsEditor;
```

- [ ] **Step 6: Run both tests to verify they pass**

Run: `npm test -- ExpectedInflowsEditor DepositsEditor`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/runway/components/ExpectedInflowsEditor.tsx src/pages/runway/components/ExpectedInflowsEditor.test.tsx src/pages/runway/components/DepositsEditor.tsx src/pages/runway/components/DepositsEditor.test.tsx
git commit -m "feat: add read-only ExpectedInflowsEditor and DepositsEditor

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 7: `PaymentsEditor` (read-only) + wire all editors into `RunwayPage` (Phase 2 milestone)

**Files:**
- Create: `src/pages/runway/components/PaymentsEditor.tsx`
- Test: `src/pages/runway/components/PaymentsEditor.test.tsx`
- Modify: `src/pages/runway/RunwayPage.tsx`

**Interfaces:**
- Consumes: `IPayment` (Task 2); `CashOnHandEditor`, `ExpectedInflowsEditor`, `DepositsEditor` (Tasks 5-6).
- Produces: `PaymentsEditor({ items: IPayment[]; onChange })` — default export.

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/runway/components/PaymentsEditor.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentsEditor from './PaymentsEditor';

describe('PaymentsEditor', () => {
  it('renders name, amount, day, and creditor when present', () => {
    render(
      <PaymentsEditor
        items={[
          { name: 'SoFi Personal Loan', amount: 0, day: 6, creditor: 'SoFi', pastDue: 1530.64 },
          { name: 'Rent', amount: 1200, day: 1 },
        ]}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByText(/SoFi Personal Loan: \$0.00 \(day 6\) \(SoFi\) — past due \$1530.64/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Rent: \$1200.00 \(day 1\)/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- PaymentsEditor`
Expected: FAIL — `Cannot find module './PaymentsEditor'`

- [ ] **Step 3: Implement `PaymentsEditor`**

```tsx
// src/pages/runway/components/PaymentsEditor.tsx
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { IPayment } from '../types/IRunwayData';

interface IPaymentsEditorProps {
  items: IPayment[];
  onChange: (items: IPayment[]) => void;
}

function describePayment(payment: IPayment): string {
  const parts = [`${payment.name}: $${payment.amount.toFixed(2)} (day ${payment.day})`];
  if (payment.creditor) parts.push(`(${payment.creditor})`);
  if (payment.pastDue) parts.push(`— past due $${payment.pastDue.toFixed(2)}`);
  return parts.join(' ');
}

const PaymentsEditor = ({ items }: IPaymentsEditorProps) => {
  return (
    <Box>
      <Typography variant="h6">Payments &amp; Debts</Typography>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.name}>
            <ListItemText primary={describePayment(item)} secondary={item.note} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PaymentsEditor;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- PaymentsEditor`
Expected: PASS

- [ ] **Step 5: Wire all four editors into `RunwayPage`**

Add the following JSX to `src/pages/runway/RunwayPage.tsx` immediately after the existing `{fileName && (...)}` block (do not remove that block — it still shows which file is loaded; this is a new block added below it):

```tsx
      {data && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <CashOnHandEditor
            items={data.cashOnHand}
            onChange={(cashOnHand) => setData({ ...data, cashOnHand })}
          />
          <ExpectedInflowsEditor
            items={data.expectedInflows}
            onChange={(expectedInflows) => setData({ ...data, expectedInflows })}
          />
          <PaymentsEditor
            items={data.payments}
            onChange={(payments) => setData({ ...data, payments })}
          />
          <DepositsEditor
            items={data.deposits}
            onChange={(deposits) => setData({ ...data, deposits })}
          />
        </Box>
      )}
```

Update the destructure at the top of `RunwayApp` to `const { data, error, fileName, load, setData } = useRunwayFile();` and add the four imports:

```typescript
import CashOnHandEditor from './components/CashOnHandEditor';
import ExpectedInflowsEditor from './components/ExpectedInflowsEditor';
import PaymentsEditor from './components/PaymentsEditor';
import DepositsEditor from './components/DepositsEditor';
```

- [ ] **Step 6: Manual test**

Run `npm run dev`, open `/runway`, load the fixture from Task 4's manual test. Expected: all four sections render with real data instead of nothing.

- [ ] **Step 7: Commit**

```bash
git add src/pages/runway/components/PaymentsEditor.tsx src/pages/runway/components/PaymentsEditor.test.tsx src/pages/runway/RunwayPage.tsx
git commit -m "feat: add read-only PaymentsEditor and wire all editors into RunwayPage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 8: `runwayEngine.ts` (Phase 3 core)

**Files:**
- Create: `src/pages/runway/engine/runwayEngine.ts`
- Test: `src/pages/runway/engine/runwayEngine.test.ts`
- Modify: `package.json` (add `@js-temporal/polyfill` dependency)

**Interfaces:**
- Consumes: `IRunwayData`, `ICashOnHandEntry`, `IDeposit`, `IExpectedInflow`, `IPayment` (Task 2).
- Produces (named exports): `getNextMonthlyDate`, `getNextWeeklyDate`, `sumCashOnHand`, `generateDepositSchedule`, `generateExpectedInflowTransactions`, `calculateRunwaySchedule`; types `IScheduledTransaction`, `IRunwaySchedule`.

- [ ] **Step 1: Install the Temporal polyfill**

```bash
npm install @js-temporal/polyfill
```

- [ ] **Step 2: Write the failing tests**

```typescript
// src/pages/runway/engine/runwayEngine.test.ts
import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  getNextMonthlyDate,
  getNextWeeklyDate,
  sumCashOnHand,
  generateDepositSchedule,
  generateExpectedInflowTransactions,
  calculateRunwaySchedule,
} from './runwayEngine';
import type { IRunwayData } from '../types/IRunwayData';

describe('getNextMonthlyDate', () => {
  it('uses this month if the target day has not passed', () => {
    const after = Temporal.PlainDate.from('2026-09-08');
    expect(getNextMonthlyDate(13, after).toString()).toBe('2026-09-13');
  });

  it('rolls to next month if the target day has passed', () => {
    const after = Temporal.PlainDate.from('2026-09-20');
    expect(getNextMonthlyDate(13, after).toString()).toBe('2026-10-13');
  });

  it('clamps to the last day of a short month', () => {
    const after = Temporal.PlainDate.from('2026-01-01');
    expect(getNextMonthlyDate(31, after).toString()).toBe('2026-01-31');
    const afterFeb = Temporal.PlainDate.from('2026-02-01');
    expect(getNextMonthlyDate(31, afterFeb).toString()).toBe('2026-02-28');
  });
});

describe('getNextWeeklyDate', () => {
  it('finds the next occurrence of a weekday (1=Mon..7=Sun)', () => {
    const tuesday = Temporal.PlainDate.from('2026-09-08'); // a Tuesday
    expect(getNextWeeklyDate(5, tuesday).toString()).toBe('2026-09-11'); // next Friday
  });
});

describe('sumCashOnHand', () => {
  it('sums all account amounts', () => {
    expect(sumCashOnHand([{ name: 'A', amount: 10 }, { name: 'B', amount: 5.5 }])).toBe(15.5);
  });
});

describe('generateDepositSchedule', () => {
  it('generates monthly occurrences up to an endDate', () => {
    const start = Temporal.PlainDate.from('2026-09-01');
    const result = generateDepositSchedule(
      [{ name: 'Paycheck', amount: 1000, frequency: 'monthly', day: 25, endDate: '2026-11-25' }],
      start,
    );
    expect(result.map((t) => t.date.toString())).toEqual(['2026-09-25', '2026-10-25', '2026-11-25']);
  });

  it('generates weekly occurrences up to a count', () => {
    const start = Temporal.PlainDate.from('2026-09-08'); // Tuesday
    const result = generateDepositSchedule(
      [{ name: 'Gig income', amount: 100, frequency: 'weekly', day: 5, occurrences: 2 }],
      start,
    );
    expect(result.map((t) => t.date.toString())).toEqual(['2026-09-11', '2026-09-18']);
  });

  it('stops at maxDate for a deposit with neither endDate nor occurrences, instead of looping forever', () => {
    const start = Temporal.PlainDate.from('2026-09-01');
    const maxDate = Temporal.PlainDate.from('2026-12-01');
    const result = generateDepositSchedule(
      [{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }],
      start,
      maxDate,
    );
    expect(result.map((t) => t.date.toString())).toEqual(['2026-09-25', '2026-10-25', '2026-11-25']);
  });
});

describe('generateExpectedInflowTransactions', () => {
  it('includes only inflows with a non-null date', () => {
    const result = generateExpectedInflowTransactions([
      { name: 'Refund', amount: 300, date: null },
      { name: 'Tax refund', amount: 450, date: '2026-04-15' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Tax refund');
  });
});

describe('calculateRunwaySchedule', () => {
  const today = Temporal.PlainDate.from('2026-09-08');

  it('starts from the sum of cashOnHand', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 500 }],
      expectedInflows: [],
      payments: [],
      deposits: [],
    };
    expect(calculateRunwaySchedule(data, today).startingBalance).toBe(500);
  });

  it('excludes a delinquent payment with amount 0 and no reinstatement fields', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 1000 }],
      expectedInflows: [],
      payments: [{ name: 'Charged off card', amount: 0, day: 5 }],
      deposits: [],
    };
    const schedule = calculateRunwaySchedule(data, today);
    expect(schedule.scheduled).toHaveLength(0);
    expect(schedule.runwayEndDate).toBeNull();
  });

  it('applies a one-time reinstatement lump then reverts to the recurring amount', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 20000 }],
      expectedInflows: [],
      payments: [
        {
          name: 'Mortgage',
          amount: 0,
          shouldBe: 14670,
          day: 13,
          reinstatementDue: '2026-11-01',
          revertsToMonthlyPayment: 2894.76,
        },
      ],
      deposits: [],
    };
    const schedule = calculateRunwaySchedule(data, today, 4);
    const amounts = schedule.scheduled.map((t) => `${t.date.toString()}: ${t.amount}`);
    expect(amounts).toContain('2026-11-01: -14670');
    expect(amounts.some((a) => a.startsWith('2026-12-13: -2894.76'))).toBe(true);
  });

  it('stops the schedule when a payment cannot be afforded', () => {
    const data: IRunwayData = {
      cashOnHand: [{ name: 'Checking', amount: 100 }],
      expectedInflows: [],
      payments: [{ name: 'Rent', amount: 1200, day: 1 }],
      deposits: [],
    };
    const schedule = calculateRunwaySchedule(data, today);
    expect(schedule.stoppedAtName).toBe('Rent');
    expect(schedule.runwayEndDate).not.toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- runwayEngine`
Expected: FAIL — `Cannot find module './runwayEngine'`

- [ ] **Step 4: Implement `runwayEngine.ts`**

```typescript
// src/pages/runway/engine/runwayEngine.ts
import { Temporal } from '@js-temporal/polyfill';
import type { ICashOnHandEntry, IDeposit, IExpectedInflow, IPayment, IRunwayData } from '../types/IRunwayData';

export interface IScheduledTransaction {
  date: Temporal.PlainDate;
  name: string;
  amount: number; // positive = money in, negative = money out
}

export interface IRunwaySchedule {
  scheduled: IScheduledTransaction[];
  startingBalance: number;
  runwayEndDate: Temporal.PlainDate | null; // null = runway extends beyond the projection window
  stoppedAtName: string | null;
}

const WEEKDAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function clampDayToMonth(year: number, month: number, targetDay: number): number {
  const monthStart = Temporal.PlainDate.from({ year, month, day: 1 });
  return Math.min(targetDay, monthStart.daysInMonth);
}

export function getNextMonthlyDate(day: number, after: Temporal.PlainDate): Temporal.PlainDate {
  if (after.day <= day) {
    return Temporal.PlainDate.from({
      year: after.year,
      month: after.month,
      day: clampDayToMonth(after.year, after.month, day),
    });
  }
  const nextMonth = after.add({ months: 1 });
  return Temporal.PlainDate.from({
    year: nextMonth.year,
    month: nextMonth.month,
    day: clampDayToMonth(nextMonth.year, nextMonth.month, day),
  });
}

export function getNextWeeklyDate(dayOfWeek: number, after: Temporal.PlainDate): Temporal.PlainDate {
  const currentDay = WEEKDAY_MAP[after.toLocaleString('en-US', { weekday: 'short' })];
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  return after.add({ days: daysUntil });
}

export function sumCashOnHand(cashOnHand: ICashOnHandEntry[]): number {
  return cashOnHand.reduce((total, entry) => total + entry.amount, 0);
}

export function generateDepositSchedule(
  deposits: IDeposit[],
  startDate: Temporal.PlainDate,
  maxDate: Temporal.PlainDate = startDate.add({ months: 120 }),
): IScheduledTransaction[] {
  const scheduled: IScheduledTransaction[] = [];

  for (const deposit of deposits) {
    const endDate = deposit.endDate ? Temporal.PlainDate.from(deposit.endDate) : null;
    let nextDate =
      deposit.frequency === 'weekly'
        ? getNextWeeklyDate(deposit.day, startDate)
        : getNextMonthlyDate(deposit.day, startDate);
    let count = 0;

    while (true) {
      // Both endDate and occurrences are optional on IDeposit — an ordinary recurring
      // deposit with neither (e.g. a paycheck with no end date) has NO break condition
      // without this maxDate check, and will run until Temporal's date range is exhausted
      // (measured: ~54 seconds, then a RangeError, on the shipped engine before this fix).
      if (Temporal.PlainDate.compare(nextDate, maxDate) > 0) break;
      if (endDate && Temporal.PlainDate.compare(nextDate, endDate) > 0) break;
      if (deposit.occurrences !== undefined && count >= deposit.occurrences) break;

      scheduled.push({ date: nextDate, name: deposit.name, amount: deposit.amount });
      count++;

      nextDate =
        deposit.frequency === 'weekly'
          ? nextDate.add({ days: 7 })
          : getNextMonthlyDate(deposit.day, nextDate.add({ days: 1 }));
    }
  }

  return scheduled;
}

export function generateExpectedInflowTransactions(inflows: IExpectedInflow[]): IScheduledTransaction[] {
  return inflows
    .filter((inflow): inflow is IExpectedInflow & { date: string } => inflow.date !== null)
    .map((inflow) => ({
      date: Temporal.PlainDate.from(inflow.date),
      name: inflow.name,
      amount: inflow.amount,
    }));
}

interface IPaymentCursor {
  payment: IPayment;
  nextDate: Temporal.PlainDate;
}

function amountDueOn(payment: IPayment, date: Temporal.PlainDate): number {
  if (payment.reinstatementDue && payment.revertsToMonthlyPayment !== undefined) {
    const reinstatementDate = Temporal.PlainDate.from(payment.reinstatementDue);
    const comparison = Temporal.PlainDate.compare(date, reinstatementDate);
    if (comparison === 0) return payment.shouldBe ?? payment.amount;
    if (comparison > 0) return payment.revertsToMonthlyPayment;
  }
  return payment.amount;
}

function firstDateForPayment(payment: IPayment, today: Temporal.PlainDate): Temporal.PlainDate {
  if (payment.reinstatementDue && payment.amount === 0) {
    return Temporal.PlainDate.from(payment.reinstatementDue);
  }
  return getNextMonthlyDate(payment.day, today);
}

// After the reinstatement lump is paid, the resumed recurring payment must fall in a later
// calendar month than the reinstatement date, never the same month. A plain day+1 advance can
// land in the same month when the reinstatement date's day-of-month is earlier than the
// payment's regular due day (e.g. reinstatement on the 1st, due day 13 -> naive advance gives
// the 13th of that SAME month, only ~12 days after the lump). Real reinstatement terms resume
// the regular payment schedule starting the month after the catch-up, so when the naive advance
// would double-bill within the reinstatement month, push to next month's occurrence instead.
function nextDateForPayment(payment: IPayment, processedDate: Temporal.PlainDate): Temporal.PlainDate {
  const candidate = getNextMonthlyDate(payment.day, processedDate.add({ days: 1 }));

  if (payment.reinstatementDue) {
    const reinstatementDate = Temporal.PlainDate.from(payment.reinstatementDue);
    const wasReinstatementPayment = Temporal.PlainDate.compare(processedDate, reinstatementDate) === 0;
    const candidateIsSameMonth = candidate.year === processedDate.year && candidate.month === processedDate.month;

    if (wasReinstatementPayment && candidateIsSameMonth) {
      return getNextMonthlyDate(payment.day, processedDate.add({ months: 1 }));
    }
  }

  return candidate;
}

export function calculateRunwaySchedule(
  runwayData: IRunwayData,
  today: Temporal.PlainDate,
  maxMonths = 120,
): IRunwaySchedule {
  const startingBalance = sumCashOnHand(runwayData.cashOnHand);
  let balance = startingBalance;
  const maxDate = today.add({ months: maxMonths });

  const deposits = [
    ...generateDepositSchedule(runwayData.deposits, today, maxDate),
    ...generateExpectedInflowTransactions(runwayData.expectedInflows),
  ].sort((a, b) => Temporal.PlainDate.compare(a.date, b.date));

  const cursors: IPaymentCursor[] = runwayData.payments
    .filter((payment) => payment.amount > 0 || (payment.reinstatementDue && payment.revertsToMonthlyPayment !== undefined))
    .map((payment) => ({ payment, nextDate: firstDateForPayment(payment, today) }));

  const scheduled: IScheduledTransaction[] = [];
  let depositIndex = 0;
  let stoppedAtName: string | null = null;
  let stoppedAtDate: Temporal.PlainDate | null = null;

  while (cursors.length > 0) {
    cursors.sort((a, b) => Temporal.PlainDate.compare(a.nextDate, b.nextDate));
    const next = cursors[0];

    if (Temporal.PlainDate.compare(next.nextDate, maxDate) > 0) break;

    while (
      depositIndex < deposits.length &&
      Temporal.PlainDate.compare(deposits[depositIndex].date, next.nextDate) <= 0
    ) {
      balance += deposits[depositIndex].amount;
      scheduled.push(deposits[depositIndex]);
      depositIndex++;
    }

    const due = amountDueOn(next.payment, next.nextDate);
    if (due > balance) {
      stoppedAtName = next.payment.name;
      stoppedAtDate = next.nextDate;
      break;
    }

    balance -= due;
    scheduled.push({ date: next.nextDate, name: next.payment.name, amount: -due });
    next.nextDate = nextDateForPayment(next.payment, next.nextDate);
  }

  return {
    scheduled,
    startingBalance,
    runwayEndDate: stoppedAtDate ? stoppedAtDate.subtract({ days: 1 }) : null,
    stoppedAtName,
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- runwayEngine`
Expected: PASS (13 tests)

- [ ] **Step 6: Commit**

```bash
git add src/pages/runway/engine/ package.json package-lock.json
git commit -m "feat: add runwayEngine, a pure port of the CLI's scheduling logic

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 9: `RunwaySchedule` component + wire into `RunwayPage` (Phase 3 milestone)

**Files:**
- Create: `src/pages/runway/components/RunwaySchedule.tsx`
- Test: `src/pages/runway/components/RunwaySchedule.test.tsx`
- Modify: `src/pages/runway/RunwayPage.tsx`

**Interfaces:**
- Consumes: `IRunwaySchedule`, `IScheduledTransaction` (Task 8); `calculateRunwaySchedule` (Task 8).
- Produces: `RunwaySchedule({ schedule: IRunwaySchedule })` — default export.

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/runway/components/RunwaySchedule.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Temporal } from '@js-temporal/polyfill';
import RunwaySchedule from './RunwaySchedule';
import type { IRunwaySchedule } from '../engine/runwayEngine';

describe('RunwaySchedule', () => {
  it('shows the runway end date and stopped-at payment when the runway ends', () => {
    const schedule: IRunwaySchedule = {
      startingBalance: 100,
      scheduled: [{ date: Temporal.PlainDate.from('2026-09-08'), name: 'Groceries', amount: -50 }],
      runwayEndDate: Temporal.PlainDate.from('2026-09-30'),
      stoppedAtName: 'Rent',
    };
    render(<RunwaySchedule schedule={schedule} />);

    expect(screen.getByText(/Runway ends 2026-09-30, before Rent/)).toBeInTheDocument();
    expect(screen.getByText(/Groceries/)).toBeInTheDocument();
  });

  it('shows an open-ended message when the runway extends beyond the projection window', () => {
    const schedule: IRunwaySchedule = {
      startingBalance: 1000000,
      scheduled: [],
      runwayEndDate: null,
      stoppedAtName: null,
    };
    render(<RunwaySchedule schedule={schedule} />);

    expect(screen.getByText(/Runway extends beyond the projection window/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- RunwaySchedule`
Expected: FAIL — `Cannot find module './RunwaySchedule'`

- [ ] **Step 3: Implement `RunwaySchedule`**

```tsx
// src/pages/runway/components/RunwaySchedule.tsx
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { IRunwaySchedule } from '../engine/runwayEngine';

interface IRunwayScheduleProps {
  schedule: IRunwaySchedule;
}

const RunwaySchedule = ({ schedule }: IRunwayScheduleProps) => {
  let runningBalance = schedule.startingBalance;

  return (
    <Box>
      <Typography variant="h6">Projected Schedule</Typography>
      <Typography sx={{ mb: 1 }}>
        {schedule.runwayEndDate
          ? `Runway ends ${schedule.runwayEndDate.toString()}, before ${schedule.stoppedAtName}`
          : 'Runway extends beyond the projection window'}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedule.scheduled.map((transaction, index) => {
            runningBalance += transaction.amount;
            return (
              <TableRow key={`${transaction.date.toString()}-${index}`}>
                <TableCell>{transaction.date.toString()}</TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell align="right">{transaction.amount.toFixed(2)}</TableCell>
                <TableCell align="right">{runningBalance.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

export default RunwaySchedule;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- RunwaySchedule`
Expected: PASS

- [ ] **Step 5: Wire it into `RunwayPage`**

In `src/pages/runway/RunwayPage.tsx`, add imports:

```typescript
import { useMemo } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import RunwaySchedule from './components/RunwaySchedule';
import { calculateRunwaySchedule } from './engine/runwayEngine';
```

Inside `RunwayApp`, after the `useRunwayFile()` call, add:

```typescript
  const schedule = useMemo(() => {
    if (!data) return null;
    return calculateRunwaySchedule(data, Temporal.Now.plainDateISO());
  }, [data]);
```

Add `{schedule && <RunwaySchedule schedule={schedule} />}` inside the `{data && (...)}` block, after the four editors.

- [ ] **Step 6: Manual test**

Run `npm run dev`, open `/runway`, load the Task 4 fixture. Expected: a "Projected Schedule" section appears below the editors showing the Rent payment and a runway end date (since the fixture's $500 can't cover a $1200 rent payment).

- [ ] **Step 7: Commit**

```bash
git add src/pages/runway/components/RunwaySchedule.tsx src/pages/runway/components/RunwaySchedule.test.tsx src/pages/runway/RunwayPage.tsx
git commit -m "feat: add RunwaySchedule and wire live calculation into RunwayPage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 10: Install Formik/Yup + make `CashOnHandEditor` editable

**Files:**
- Modify: `package.json` (add `formik`, `yup`, `@testing-library/user-event` dependencies)
- Modify: `src/pages/runway/components/CashOnHandEditor.tsx`
- Modify: `src/pages/runway/components/CashOnHandEditor.test.tsx`

**Interfaces:**
- No change to `CashOnHandEditor`'s external props signature — `onChange` now actually fires.

- [ ] **Step 1: Install Formik, Yup, and user-event**

```bash
npm install formik yup
npm install -D @testing-library/user-event
```

If npm reports a peer dependency conflict against React 19 (Formik's `package.json` may not list React 19 in its peer range yet), re-run with `npm install formik yup --legacy-peer-deps` and note this in the commit message — Formik has no React-version-specific code paths that would actually break under React 19, the conflict (if any) is a stale peer-range declaration.

- [ ] **Step 2: Extend the test to cover editing**

Add to `src/pages/runway/components/CashOnHandEditor.test.tsx` (keep the existing test):

```tsx
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// ...existing describe block stays, add this one below it:

describe('CashOnHandEditor editing', () => {
  it('calls onChange with the updated name after editing and blurring a field', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<CashOnHandEditor items={[{ name: 'Checking', amount: 100 }]} onChange={handleChange} />);

    const nameInput = screen.getByPlaceholderText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Savings');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([{ name: 'Savings', amount: 100 }]);
  });

  it('adds a new blank account row when Add Account is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<CashOnHandEditor items={[]} onChange={handleChange} />);

    await user.click(screen.getByText('Add Account'));

    expect(handleChange).toHaveBeenCalledWith([{ name: '', amount: 0 }]);
  });

  it('preserves institution in the onChange payload even though it has no editable field', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CashOnHandEditor
        items={[{ name: 'Checking', amount: 100, institution: 'Wells Fargo' }]}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByPlaceholderText('Amount'));
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([
      { name: 'Checking', amount: 100, institution: 'Wells Fargo' },
    ]);
  });
});
```

- [ ] **Step 3: Run the tests to verify the new ones fail**

Run: `npm test -- CashOnHandEditor`
Expected: FAIL — no `placeholder="Name"` field or "Add Account" button exists yet

- [ ] **Step 4: Rewrite `CashOnHandEditor` as a Formik JSX form**

```tsx
// src/pages/runway/components/CashOnHandEditor.tsx
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
```

**Two fixes versus an earlier draft of this task, both apply to Tasks 11/12's editors too — carry them forward:**
1. **Institution + a running total are restored** (both existed in Task 5's read-only version and were dropped in an earlier draft of this Formik rewrite). The data was never actually lost from `onChange`'s payload — only its on-screen display was — but "the data survives structurally" isn't the same as the UI actually showing it, so both are back.
2. **`onBlur` now calls Formik's own `handleBlur` before `onChange`.** `<Field as={...}>` spreads Formik's own `field` props (including its `handleBlur`) first, then the caller's props second — so a caller-supplied `onBlur` that doesn't itself call `handleBlur` silently replaces it, meaning Formik's `touched` state is never set for that field. Invisible today (no validation-error UI exists yet), but it would silently defeat the `cashOnHandSchema` Yup validation's `touched`-gated error display the moment any future task tries to show one. Destructure `handleBlur` from the same render-prop that already provides `values`, and call it first in every `onBlur` handler.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- CashOnHandEditor`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/pages/runway/components/CashOnHandEditor.tsx src/pages/runway/components/CashOnHandEditor.test.tsx
git commit -m "feat: make CashOnHandEditor editable with Formik/Yup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 11: Make `ExpectedInflowsEditor` and `DepositsEditor` editable

**Files:**
- Modify: `src/pages/runway/components/ExpectedInflowsEditor.tsx`
- Modify: `src/pages/runway/components/ExpectedInflowsEditor.test.tsx`
- Modify: `src/pages/runway/components/DepositsEditor.tsx`
- Modify: `src/pages/runway/components/DepositsEditor.test.tsx`

**Interfaces:**
- No change to either component's external props signature.

- [ ] **Step 1: Extend `ExpectedInflowsEditor.test.tsx` with an editing test**

Add below the existing describe block:

```tsx
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('ExpectedInflowsEditor editing', () => {
  it('calls onChange with the updated amount after editing and blurring', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ExpectedInflowsEditor items={[{ name: 'Refund', amount: 300, date: null }]} onChange={handleChange} />,
    );

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '350');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([{ name: 'Refund', amount: 350, date: null }]);
  });
});
```

- [ ] **Step 2: Extend `DepositsEditor.test.tsx` with an editing test**

Add below the existing describe block:

```tsx
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('DepositsEditor editing', () => {
  it('calls onChange with the updated frequency', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DepositsEditor
        items={[{ name: 'Paycheck', amount: 1500, frequency: 'monthly', day: 25 }]}
        onChange={handleChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Frequency'), 'weekly');

    expect(handleChange).toHaveBeenCalledWith([
      { name: 'Paycheck', amount: 1500, frequency: 'weekly', day: 25 },
    ]);
  });
});
```

- [ ] **Step 3: Run both to verify the new tests fail**

Run: `npm test -- ExpectedInflowsEditor DepositsEditor`
Expected: FAIL — no editable fields exist yet

- [ ] **Step 4: Rewrite `ExpectedInflowsEditor`**

```tsx
// src/pages/runway/components/ExpectedInflowsEditor.tsx
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
      {({ values, handleBlur }) => (
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
```

- [ ] **Step 5: Rewrite `DepositsEditor`**

```tsx
// src/pages/runway/components/DepositsEditor.tsx
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Box, Button, IconButton, MenuItem, TextField, Typography } from '@mui/material';
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
      {({ values, handleBlur }) => (
        <Form>
          <Typography variant="h6">Deposits</Typography>
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
                    <Field
                      as={TextField}
                      select
                      size="small"
                      label="Frequency"
                      name={`entries.${index}.frequency`}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const next = values.entries.map((item, i) =>
                          i === index ? { ...item, frequency: event.target.value as 'weekly' | 'monthly' } : item,
                        );
                        onChange(next);
                      }}
                    >
                      <MenuItem value="weekly">weekly</MenuItem>
                      <MenuItem value="monthly">monthly</MenuItem>
                    </Field>
                    <Field
                      as={TextField}
                      size="small"
                      type="number"
                      name={`entries.${index}.day`}
                      placeholder="Day"
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
```

Note: the `frequency` `<Field as={TextField} select>` uses Formik's `onChange` directly (not `onBlur`) because MUI's `select` fires a synthetic change event immediately on selection rather than requiring a blur — matching how `userEvent.selectOptions` interacts with it in the test.

- [ ] **Step 6: Run both to verify all tests pass**

Run: `npm test -- ExpectedInflowsEditor DepositsEditor`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/runway/components/ExpectedInflowsEditor.tsx src/pages/runway/components/ExpectedInflowsEditor.test.tsx src/pages/runway/components/DepositsEditor.tsx src/pages/runway/components/DepositsEditor.test.tsx
git commit -m "feat: make ExpectedInflowsEditor and DepositsEditor editable

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 12: Make `PaymentsEditor` editable (Phase 4 milestone)

**Files:**
- Modify: `src/pages/runway/components/PaymentsEditor.tsx`
- Modify: `src/pages/runway/components/PaymentsEditor.test.tsx`

**Interfaces:**
- No change to `PaymentsEditor`'s external props signature.

- [ ] **Step 1: Extend the test with an editing case**

Add below the existing describe block:

```tsx
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('PaymentsEditor editing', () => {
  it('calls onChange with the updated amount after editing and blurring', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsEditor items={[{ name: 'Rent', amount: 1200, day: 1 }]} onChange={handleChange} />);

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '1250');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([{ name: 'Rent', amount: 1250, day: 1 }]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- PaymentsEditor`
Expected: FAIL — no `placeholder="Amount"` field exists yet

- [ ] **Step 3: Rewrite `PaymentsEditor`**

```tsx
// src/pages/runway/components/PaymentsEditor.tsx
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
      {({ values, handleBlur }) => (
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
```

**Two fixes versus an earlier draft of this task, both learned from Task 10's fix round and applied here before they could recur:**
1. **`onBlur` now calls Formik's own `handleBlur` before `onChange`** on all five fields — same reasoning as Task 10: `<Field as={...}>` spreads Formik's `field` props first, caller's second, so an `onBlur` that skips `handleBlur` silently breaks `touched` state for any future validation UI.
2. **`pastDue` is restored as a non-editable display** (`entry.pastDue ? <Typography color="error">past due $X.XX</Typography> : null`) — Task 7's read-only version showed it as part of `describePayment`'s output, and an earlier draft of this task's editable rewrite dropped it with nothing replacing it, the same class of regression Task 10 had with `institution`.

- [ ] **Step 3a: Add a regression-guard test for `pastDue`**

Add to the same `describe('PaymentsEditor editing', ...)` block from Step 1:

```tsx
  it('preserves pastDue in the onChange payload even though it has no editable field', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaymentsEditor
        items={[{ name: 'SoFi Personal Loan', amount: 0, day: 6, pastDue: 1530.64 }]}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByPlaceholderText('Day'));
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith([
      { name: 'SoFi Personal Loan', amount: 0, day: 6, pastDue: 1530.64 },
    ]);
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- PaymentsEditor`
Expected: PASS (3 tests)

- [ ] **Step 5: Full manual test of Phase 4**

Run `npm run dev`, open `/runway`, load the Task 4 fixture. Edit a value in each of the four sections (blur after each). Expected: the "Projected Schedule" table below updates live to reflect each edit, without needing to save or reload.

- [ ] **Step 6: Commit**

```bash
git add src/pages/runway/components/PaymentsEditor.tsx src/pages/runway/components/PaymentsEditor.test.tsx
git commit -m "feat: make PaymentsEditor editable, completing the edit-data phase

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## Task 13: Save data back to disk (Phase 5 milestone)

**Files:**
- Modify: `src/pages/runway/hooks/useRunwayFile.ts`
- Modify: `src/pages/runway/RunwayPage.tsx`

**Interfaces:**
- Modifies: `useRunwayFile()`'s return type gains `save: () => Promise<void>` and `canSave: boolean`.

- [ ] **Step 1: Add `save` to `useRunwayFile`**

In `src/pages/runway/hooks/useRunwayFile.ts`:

Change `const [, setHandle] = useState<FileSystemFileHandle | null>(null);` to:

```typescript
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
```

Add the import at the top:

```typescript
import { serializeRunwayData } from './runwayFileIO';
```

Add, after the `load` callback:

```typescript
  const save = useCallback(async () => {
    if (!handle || !data) return;
    setError(null);
    try {
      const writable = await handle.createWritable();
      await writable.write(serializeRunwayData(data));
      await writable.close();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not save: ${err.message}. Try opening the file again.`
          : 'Could not save the file.',
      );
    }
  }, [handle, data]);
```

Update the interface and return statement:

```typescript
interface IUseRunwayFileResult {
  data: IRunwayData | null;
  error: string | null;
  fileName: string | null;
  canSave: boolean;
  load: () => Promise<void>;
  save: () => Promise<void>;
  setData: (data: IRunwayData) => void;
}
```

```typescript
  return { data, error, fileName, canSave: handle !== null, load, save, setData };
```

- [ ] **Step 2: Add the Save button to `RunwayPage`**

In `src/pages/runway/RunwayPage.tsx`, update the destructure:

```typescript
  const { data, error, fileName, canSave, load, save, setData } = useRunwayFile();
```

Add a Save button next to the existing "Open runway.json" button:

```tsx
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={load}>
          Open runway.json
        </Button>
        <Button variant="outlined" onClick={save} disabled={!canSave}>
          Save
        </Button>
      </Box>
```

(This replaces the single standalone `<Button variant="contained" onClick={load}>` — wrap both buttons in the `Box` shown above.)

- [ ] **Step 3: Type-check and build**

```bash
npx tsc -b
npm run build
```

Expected: both succeed with no errors.

- [ ] **Step 4: Manual test — full round trip**

Using the fixture from Task 4 (`/tmp/runway-test.json`):

1. `npm run dev`, open `/runway`, load the fixture.
2. Edit the Checking account amount from 500 to 750, blur the field.
3. Click "Save".
4. Reopen `/tmp/runway-test.json` in a text editor (or reload the page and load the file again).

Expected: the file on disk now shows `"amount": 750` for Checking, and reloading it in the page shows the same updated value — confirming the full load → edit → save → reload round trip.

- [ ] **Step 5: Commit**

```bash
git add src/pages/runway/hooks/useRunwayFile.ts src/pages/runway/RunwayPage.tsx
git commit -m "feat: add save-to-disk, completing all five implementation phases

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016ojxK195Dm1ENya3d1FttV"
```

---

## After Task 13

The page is feature-complete per the spec, still on `feature/runway-webpage`. Per the spec's Branching & Deployment section, do not merge to `master` until the page is ready to go live — merging is a separate, explicit decision, not part of this plan.
