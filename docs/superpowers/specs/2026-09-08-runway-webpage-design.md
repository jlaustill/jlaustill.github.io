# Runway Webpage Design

## Summary

Port the `jlaustill/runway` CLI (a financial runway calculator) into a new page on this site at `/runway`, with a richer, editable data model than the CLI's current schema. The page loads a `runway.json` file straight from the user's local disk via the File System Access API, lets them view/edit it, computes a live projected balance and runway end date, and saves back to the same file — no data ever leaves the browser.

## Goals

- Add `/runway` as a new lazy-loaded page, following existing route/nav/prerender conventions.
- Load an existing `runway.json` from local disk (Chromium-only, via `showOpenFilePicker`).
- Display the loaded data, then compute and display a projected balance schedule and runway end date.
- Allow editing every field in the richer schema (see Data Model) via Formik + Yup forms.
- Save edits back to the same file on disk via `createWritable()`.
- Ship as 5 incremental, independently working phases (below), each a real commit.

## Non-Goals (v1)

- No non-Chromium fallback (`<input type=file>` + download). Can be added later if requested.
- No support for opening multiple files/profiles in one session.
- No autosave — saving is an explicit user action.
- No backend, no accounts, no sync. This is a static, local-only tool.
- No changes to the `jlaustill/runway` CLI repo itself; it's inspiration only.

## Route & Navigation

| Route | Component | Loading |
|-------|-----------|---------|
| `/runway` | `RunwayPage` | Lazy (`React.lazy` + `Suspense`), matching `turbo-calculator`/`kfa`/`econ-spectrum` |

- Add `{ path: '/runway', title: 'Runway | joSUu ostel', description: 'Personal financial runway calculator — loads and saves a local runway.json file, no data leaves your device.' }` to `routeMeta.ts`. **Required**: `getRouteMeta` throws on a missing path, and every entry in `routeMeta` is automatically prerendered and included in the sitemap (`entry-server.tsx`'s `routes` is `routeMeta.map(...)`) — there's no way to add a nav route without this.
- Add a "Runway" button to `AppLayout.tsx`'s nav bar, matching the existing `Button`/`RouterLink` pattern.

## Prerendering constraint (important)

Every route in `routeMeta` — including lazy ones — is rendered to real static HTML at build time via Node SSR (`entry-server.tsx` + `scripts/prerender.mjs`), not just a loading spinner. `RunwayPage` must therefore never call browser-only APIs (`showOpenFilePicker`, `window.*`, `localStorage`, feature detection) at module scope or during the initial render body — only inside `useEffect` or event handlers, which never execute during SSR string rendering. Written this way, the server-rendered output is naturally just the "no file loaded yet" initial state, and the existing hydration logic in `main.tsx` (`hydrateRoot` when the prerendered path matches) picks it up normally. No special-case exclusion from prerendering is needed if this constraint is followed.

## Data Model

Adopts the current richer `runway.json` shape (from the `new_job` repo's live file) as the canonical schema going forward, superseding the CLI's simpler `{cashOnHand: number, payments: [{name,amount,day}]}` shape.

```typescript
interface ICashOnHandEntry {
  name: string;
  amount: number;
  institution?: string;
  note?: string;
}

interface IExpectedInflow {
  name: string;
  amount: number;
  date: string | null; // excluded from calculation while null
  note?: string;
}

interface IPayment {
  name: string;
  amount: number;        // what's ACTUALLY being paid right now — the real cash-flow number
  shouldBe?: number;      // full contractual payment (informational, or a one-time future amount — see below)
  pastDue?: number | null;
  day: number;            // 1-31
  balance?: number;
  creditor?: string;
  merchant?: string;
  type?: string;
  collateral?: string | null;
  disposition?: 'keep' | 'cancel' | null;
  chargeOffDate?: string | null;
  updatedAt?: string | null;
  note?: string;
  // Mortgage-style forbearance/reinstatement special case:
  reinstatementDue?: string;        // date a one-time lump (shouldBe) becomes due
  revertsToMonthlyPayment?: number; // recurring amount that resumes after reinstatementDue
}

interface IDeposit {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  day: number;
  startDate?: string;
  endDate?: string;
  occurrences?: number;
}

interface IRunwayData {
  cashOnHand: ICashOnHandEntry[];
  expectedInflows: IExpectedInflow[];
  payments: IPayment[];
  deposits: IDeposit[];
}
```

## Calculation Engine (`runwayEngine.ts`)

A pure, framework-free port of the CLI's `generateTransactionSchedule`/`generateDepositSchedule`/date-clamping logic (`jlaustill/runway`'s `src/index.ts`), extended for the richer schema:

- **Starting balance** = sum of all `cashOnHand[].amount`.
- **Recurring cash outflow per payment** = `amount` (what's really being paid), never `shouldBe`. Delinquent debts already sit at `amount: 0` because they're deliberately not being paid (going to collections) — using `amount` keeps the projection realistic instead of contractual.
- **Reinstatement special case**: if a payment has `reinstatementDue` + `revertsToMonthlyPayment`, the schedule applies a one-time deduction of `shouldBe` on `reinstatementDue`, then switches that payment to a recurring monthly deduction of `revertsToMonthlyPayment` on `day` from then on.
- **`expectedInflows`**: included as one-time deposits only when `date` is non-null; a null-date inflow is excluded (matches the existing convention already documented in `runway.json`'s own notes: "move it into cashOnHand when the check lands").
- **Deposits**: same weekly/monthly/`endDate`/`occurrences` logic as the CLI, ported as-is.
- Uses the native `Temporal` API where available; if Chromium's current release lacks it, add `@js-temporal/polyfill` as a dependency rather than assume support — confirm during implementation.
- Output: an ordered list of `{date, name, amount, runningBalance}`, plus either a runway end date (first unaffordable payment) or "extends beyond N years," mirroring the CLI's existing behavior.

## Components

```
src/pages/runway/
├── RunwayPage.tsx                 # top-level: file state, phase wiring
├── hooks/
│   └── useRunwayFile.ts           # showOpenFilePicker / createWritable wrapper
├── engine/
│   ├── runwayEngine.ts
│   └── runwayEngine.test.ts       # Vitest
├── components/
│   ├── CashOnHandEditor.tsx
│   ├── ExpectedInflowsEditor.tsx
│   ├── PaymentsEditor.tsx
│   ├── DepositsEditor.tsx
│   └── RunwaySchedule.tsx
└── types/
    └── IRunwayData.ts
```

- `useRunwayFile` holds the `FileSystemFileHandle`, the parsed `IRunwayData`, and exposes `load()`/`save()`/`data`/`setData`.
- Each editor is a `<Formik>` **JSX component** (not the `useFormik()` hook — avoids the stale-closure bugs the hook form is prone to when nested in complex parent state) paired with a Yup schema matching its slice of `IRunwayData`.
- `RunwaySchedule` recomputes via `useMemo` off `data`, live, before any save.

## Data Flow

1. User clicks "Open runway.json" → `showOpenFilePicker()` → read the file → `JSON.parse` → store in state along with the handle.
2. Edits go through the Formik forms → update in-memory `IRunwayData` (no autosave).
3. `RunwaySchedule` recomputes automatically off the in-memory state on every edit.
4. "Save" writes the current in-memory state back to the same file handle via `createWritable()`.

## Error Handling

- No file loaded → prompt to open one; no crash.
- Malformed JSON on load → show a parse error, keep any existing in-memory state untouched.
- `'showOpenFilePicker' in window` is false → clear message ("Use Chrome or Edge for this tool"), detected client-side only per the prerendering constraint above.
- File permission revoked mid-session → catch on save, re-prompt to re-pick the file.

## Testing

- `runwayEngine.ts`: Vitest unit tests for monthly/weekly deposit generation, day-of-month clamping, the mortgage reinstatement special case, `expectedInflows` with/without a date, and the "can't afford the next payment" stop condition. **Vitest is new to this repo** — no test runner exists today; this adds it as a dev dependency plus a `test` npm script.
- File System Access flow: manual/browser testing (open → edit → save → reopen, confirm round-trip fidelity). Not practically unit-testable.

## Implementation Phases

Each phase is a real, working commit before moving to the next:

1. **Load file** — file picker, read, parse, hold handle + raw data in state. No UI beyond confirming it loaded.
2. **Display data** — read-only rendering of everything in the file.
3. **Calculate** — port `runwayEngine.ts` (with its Vitest tests) and `RunwaySchedule`, computed against the read-only data.
4. **Edit data** — Formik/Yup forms replace the read-only views; editing updates in-memory state; schedule keeps recomputing live.
5. **Save data** — wire `createWritable()` to persist in-memory state back to the file handle.

## Branching & Deployment

- All work happens on `feature/runway-webpage` (already created off `master`).
- Deployment is already gated by the existing setup: GitHub Actions only builds/deploys `gh-pages` on push to `master` (per this repo's `CLAUDE.md`), so working on a branch inherently keeps this off the live site — no extra CI changes needed. Merge to `master` only when the page is ready to go live.

## New Dependencies

- `formik`, `yup` — editing forms (phase 4). Formik's peer dependencies may not officially list React 19 yet; verify compatibility (or install with an override) during implementation rather than assume it works cleanly.
- `vitest` (dev) — engine unit tests (phase 3).
- `@js-temporal/polyfill` — only if Chromium's current stable release doesn't yet support the native `Temporal` API; confirm during implementation before adding.
