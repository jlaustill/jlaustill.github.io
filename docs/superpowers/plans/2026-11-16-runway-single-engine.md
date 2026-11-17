# Runway Single Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `/runway` page the only runway tool: port the CLI's debt-aware engine into the page, read the data file's current schema unchanged, and prove a save never loses a field.

**Architecture:** Pure engine modules under `src/pages/runway/engine/` (debt, payments, calendar, income, the schedule loop) feed `calculateRunway`, whose result type lives in `types/IRunwayResult.ts`. The page keeps its open/edit/save flow; editors gain the fields the file actually holds; a page-level round-trip test guards every task.

**Tech Stack:** React 19, TypeScript 5.7 (`lib: ES2020`), MUI 7, Formik + Yup, `@js-temporal/polyfill`, vitest 5 + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-16-runway-single-engine-design.md`

## Global Constraints

- Public repo: no real financial data in any file, commit message or PR text. Fixtures use generic names (`Checking`, `Card`, `Example Bank`) and round numbers.
- No `Object.hasOwn`, no `Array.prototype.at` (`lib: ES2020`, and `tsc -b` type-checks tests).
- `import { Temporal } from '@js-temporal/polyfill'` in every file that uses Temporal.
- Interfaces `I`-prefixed, type aliases `T`-prefixed; components default-export at the bottom.
- Horizon: 120 months. `interestRate` is the annual percentage as printed (`24.99` = 24.99%).
- Saved text: `JSON.stringify(data, null, 2) + '\n'`.
- The real data file is never copied into the repo; its path reaches tests only through `RUNWAY_FILE` at run time.
- Before every commit: `npx vitest run`, `npx tsc -b`, `npm run lint` all pass.

## Review Focus

1. A blank balance, interest rate or escrow in the payments editor removes the value; it never becomes `0` (a `0` balance reads as paid off and lengthens the runway). Test: Task 7.
2. Malformed dates (`''`, `'2027-02-30'`, `'~2031'`, missing) mean "no date": no crash, no money counted. Tests: Task 3 (`parseIsoDate`, inflows), Task 2 (a bad plan date is skipped).
3. Recurring income with empty or out-of-range `days`, or `amount` 0, produces no deposits instead of crashing or looping. Test: Task 3.
4. An optional array that is present but not an array (`"recurringIncome": {}`) is a clear load error, not a crash. Test: Task 4.
5. Money due or arriving today counts today, for bills and income alike. Tests: Task 2 (`getNextDueDate`), Task 3 (income).

---

### Task 1: Round-trip safety net

**Files:**
- Create: `src/pages/runway/testUtils/pageRoundTrip.tsx`
- Create: `src/pages/runway/RunwayPage.roundTrip.test.tsx`

**Interfaces:**
- Produces: `saveWithoutEdits(fileText: string): Promise<string>` renders `RunwayApp`, opens `fileText` through a stubbed `showOpenFilePicker`, presses Tab once per focusable element (`input, select, textarea, button`, plus one), clicks Save, and resolves to the text the stubbed `createWritable()` received. It unstubs globals afterwards.
- Produces: `liveShapedFile` (exported from the test util), a synthetic object shaped like the real file: two cash entries (one with made-up `institution`, `accountNumber`, `routingNumber`, `note`, `updatedAt`); two inflows (`{ amount: 900, gross: 1400, date: null, expectedMonth: '2027-03', confirmed: true }` and `{ amount: null, date: null, expectedMonth: '~2031', confirmed: false }`); one `recurringIncome` entry (`semi-monthly`, `days: [1, 15]`, extra `employer`, `type`, `disposition`); six payments covering `utility` with `pastDue: null`, `creditCard` with `balance` and `note: ''`, `mortgage` with `reinstatedOn`, `collection` with `amount: 0` and a `paymentPlan` carrying extra keys (`frequency`, `finalAmount`, `paymentMethod`, `confirmationReferenceId`), `secured` with `interestRate` and `payoff`, and a cancelled `subscription` at `amount: 0`; `deposits: []` (removed in Task 4); and `extraTopLevelKey: { kept: true }`.

- [ ] **Step 1: Write the test**

```tsx
it('saves a file it was only tabbed through without changing anything', async () => {
  const saved = await saveWithoutEdits(JSON.stringify(liveShapedFile));
  expect(JSON.parse(saved)).toEqual(liveShapedFile);
}, 20_000);
```

- [ ] **Step 2: Run it.** `npx vitest run src/pages/runway/RunwayPage.roundTrip.test.tsx`. Expected: PASS. This pins today's behavior before anything changes. If it fails, the current page already loses data: fix that first, in this task.
- [ ] **Step 3: Commit.** `test: pin a lossless no-edit save through the runway page`

### Task 2: Debt and payment rules

**Files:**
- Create: `src/pages/runway/engine/debt.ts`, `src/pages/runway/engine/debt.test.ts`
- Create: `src/pages/runway/engine/payments.ts`, `src/pages/runway/engine/payments.test.ts`
- Create: `src/pages/runway/types/IRunwayResult.ts`
- Modify: `src/pages/runway/types/IRunwayData.ts` (additive: `IPaymentPlan`, and optional `interestRate`, `escrow`, `paymentPlan` on `IPayment`)

**Interfaces:**
- Produces (`debt.ts`, ported from the CLI with `apr` renamed `interestRate`): `type TDebtField = 'balance' | 'interestRate' | 'escrow'`; `DEBT_FIELDS` (creditCard, personalLoan, unsecured, secured: balance + interestRate; mortgage: + escrow; collection: balance); `type TDebtType`; `interface IDebtValues { type?: string; balance?: number; interestRate?: number; escrow?: number }`; `interface IDebt { balance: number; interestRate: number; escrow: number; accruedThrough: Temporal.PlainDate }`; `interface IPaymentResult { paid: number; debt: IDebt; paidOff: boolean }`; `isDebtType(type: string | undefined): type is TDebtType` (via `Object.prototype.hasOwnProperty.call`); `findMissingDebtFields(values: IDebtValues): TDebtField[]`; `createDebt(values: IDebtValues, asOf: Temporal.PlainDate): IDebt | null`; `applyPayment(debt: IDebt, scheduledAmount: number, date: Temporal.PlainDate): IPaymentResult`.
- Produces (`IRunwayResult.ts`): `IScheduledTransaction { date: Temporal.PlainDate; name: string; amount: number; paidOff?: boolean }`; `TPayoffProjection = { status: 'paidOff'; date: Temporal.PlainDate } | { status: 'neverPaysOff' } | { status: 'beyondHorizon' } | { status: 'missingValues'; fields: TDebtField[] }`.
- Produces (`payments.ts`): `interface IDueDate { date: Temporal.PlainDate; amount: number; fromPlan: boolean }`; `getNextDueDate(payment: IPayment, onOrAfter: Temporal.PlainDate): IDueDate | null`; `projectPayoff(payment: IPayment, today: Temporal.PlainDate, maxDate: Temporal.PlainDate): TPayoffProjection | null`. Plan dates are read with `parseIsoDate` (Task 3 moves it to `calendar.ts`; define it in `payments.ts` for now and move it then). `getNextMonthlyDate` is copied here for now and moved to `calendar.ts` in Task 3.

- [ ] **Step 1: Write the failing tests.** Port `debt.test.ts` case for case from the CLI into vitest, swapping its values for these: a card `balance: 5000` (expects `['interestRate']`); a mortgage `{ balance: 200000, interestRate: 6 }` (expects `['escrow']`); a collection `balance: 2400` (expects `[]`, and `createDebt` gives `interestRate: 0, escrow: 0`). Keep the accrual cases as they are, since their numbers are generic: 36.5% for 10 days on 1000, paying 100, leaves 910; two 14-day accruals give 1014 and then 1028.2; a final payment of 100 against 50 pays 50; escrow 400 gives 1400 and then 400; and 365% for 10 days, paying 50, gives 1050. In `payments.test.ts`, with `today = 2026-10-09` and `storeCard = { name: 'Store card', amount: 300, day: 6, paymentPlan: { amount: 450, dueDates: ['2026-10-06', '2026-11-06', '2026-12-06'] } }`:

```ts
expect(getNextDueDate(storeCard, today)).toMatchObject({ amount: 450, fromPlan: true }); // date 2026-11-06
// from 2026-12-07: 2027-01-06, amount 300, fromPlan false; with amount 0: null
// dueDates ['2026-12-06', '2026-11-06'] still gives 2026-11-06
// ['not-a-date', '2026-11-06'] gives 2026-11-06                       (Review Focus 2)
// { name: 'Phone', amount: 80, day: 17 } gives 2026-10-17; day 9 gives 2026-10-09 (Review Focus 5)
// projectPayoff, maxDate = today + 120 months:
//   collection, balance 2400, plan of 400 on 2026-10-16, 10-30, 11-13, 11-27, 12-11, 12-25: paidOff 2026-12-25
//   personalLoan, amount 100, day 9, balance 1000, interestRate 12: paidOff 2027-08-09
//   creditCard, amount 400, day 6, balance 20000, interestRate 30: { status: 'neverPaysOff' }
//   mortgage, amount 1800, day 1, balance 200000, interestRate 6, escrow 450: { status: 'beyondHorizon' }
//   creditCard, amount 300, day 5, balance 5000: { status: 'missingValues', fields: ['interestRate'] }
//   utility: null
```

- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/engine/debt.test.ts src/pages/runway/engine/payments.test.ts`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** `debt.ts` and `payments.ts` by porting the CLI's `debt.ts`, `getNextDueDate` and `projectPayoff`, with `onOrAfter` semantics (a payment due today is due today) and invalid plan dates skipped.
- [ ] **Step 4: Run.** Same command. Expected: PASS. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: port the debt and payment-plan rules into the runway engine`

### Task 3: Dates, income and inflows

**Files:**
- Create: `src/pages/runway/engine/calendar.ts`, `calendar.test.ts`, `income.ts`, `income.test.ts` (all under `engine/`)
- Modify: `engine/payments.ts` (import the date helpers from `calendar.ts`)
- Modify: `types/IRunwayData.ts` (additive: `TIncomeSchedule = 'semi-monthly' | 'monthly' | 'weekly'`; `IRecurringIncome { name; amount; schedule; days: number[]; startDate?; endDate?; note? }`; `IExpectedInflow` gains `expectedMonth?: string | null` and `confirmed?: boolean`, and `amount` becomes `number | null`. Make the old engine's inflow filter also skip `amount === null` so it still compiles until Task 4.)

**Interfaces:**
- Produces (`calendar.ts`): `getNextMonthlyDate(day: number, onOrAfter: Temporal.PlainDate): Temporal.PlainDate` (clamped to month length); `getNextWeeklyDate(isoWeekday: number, onOrAfter: Temporal.PlainDate): Temporal.PlainDate` (the same day counts); `parseIsoDate(value: unknown): Temporal.PlainDate | null` (only `YYYY-MM-DD`, `overflow: 'reject'`); `lastDayOfMonth(yearMonth: unknown): Temporal.PlainDate | null` (only `YYYY-MM`).
- Produces (`income.ts`): `generateIncomeDeposits(income: IRecurringIncome[], today: Temporal.PlainDate, maxDate: Temporal.PlainDate): IScheduledTransaction[]` and `generateInflowDeposits(inflows: IExpectedInflow[], today: Temporal.PlainDate, maxDate: Temporal.PlainDate): IScheduledTransaction[]`, each sorted by date, with every bound inclusive.

- [ ] **Step 1: Write the failing tests** (all dates are ISO strings of the result):
  - `getNextMonthlyDate`: (13, 2026-09-08) gives 09-13; (13, 09-20) gives 10-13; (31, 2026-02-01) gives 02-28; (8, 2026-09-08) gives 09-08.
  - `getNextWeeklyDate`: (5, Tue 2026-09-08) gives 09-11; (2, 2026-09-08) gives 09-08.
  - `parseIsoDate`: `'2027-02-10'` gives a date; `''`, `null`, `42`, `'2027-02-30'`, `'2027-2-1'` give null.
  - `lastDayOfMonth`: `'2027-02'` gives 2027-02-28; `'2028-02'` gives 2028-02-29; `'~2031'`, `'2027-13'`, `null` give null.
  - Income, with today 2026-11-16:
    - semi-monthly `[1, 15]` to 2027-01-31 gives 12-01, 12-15, 01-01, 01-15;
    - with today 2026-12-15 and maxDate 2027-01-01, it gives 12-15 and 01-01 (Review Focus 5);
    - monthly `[31]` from 2027-01-01 to 03-31 gives 01-31, 02-28, 03-31;
    - weekly `[5]` from 2026-09-08 to 09-25 gives 09-11, 09-18, 09-25, and from 2026-09-11 it starts on 09-11;
    - `startDate: '2027-01-10'`, monthly `[1]`, to 2027-03-31, gives 02-01 and 03-01;
    - a past `startDate` changes nothing;
    - `endDate: '2026-12-15'` gives 12-01 and 12-15;
    - open-ended `[1, 15]` to 2027-02-16 gives exactly 6 deposits;
    - `days: []`, `days: [0, 32, 1.5]`, weekly `[8]` and `amount: 0` each give `[]` (Review Focus 3).
  - Inflows, with today 2026-11-16 and a 120-month maxDate:
    - confirmed, amount 900, month `'2027-03'` lands on 2027-03-31;
    - `date: '2027-02-10'` with a month lands on 02-10 (the date wins);
    - month `'2026-11'` lands on 2026-11-30;
    - `date: ''` with month `'2027-03'` lands on 03-31;
    - none counted for: `confirmed: false`, `confirmed` missing, `amount: null`, `amount: 0`, `'~2031'`, a date before today, month `'2026-10'`, or `'2027-02-30'` with no month (Review Focus 2).
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/engine/calendar.test.ts src/pages/runway/engine/income.test.ts`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the four calendar helpers and both generators. Income seeds from the later of today and `startDate`, and stops after the earlier of `endDate` and `maxDate`. `days` must be integers in 1 to 31 (weekly: 1 to 7); invalid entries are ignored, and an entry with no valid days yields nothing.
- [ ] **Step 4: Run.** The same command, plus `payments.test.ts`. Expected: PASS. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: add recurring income and confirmed inflows to the runway engine`

### Task 4: Switch the page to the new engine and schema

**Files:**
- Rewrite: `engine/runwayEngine.ts`, `engine/runwayEngine.test.ts`
- Modify: `types/IRunwayData.ts` (final: `IRunwayData { cashOnHand; payments; recurringIncome: IRecurringIncome[]; expectedInflows: IExpectedInflow[] }`; remove `IDeposit`, `deposits`, `reinstatementDue`, `revertsToMonthlyPayment`)
- Modify: `types/IRunwayResult.ts` (add `IDebtPayoff { name: string; projection: TPayoffProjection }` and `IRunwayResult`)
- Modify: `hooks/runwayFileIO.ts`, `hooks/runwayFileIO.test.ts`
- Modify: `RunwayPage.tsx` (no deposits section; the "Loaded" line counts `recurringIncome`; `useMemo(() => calculateRunway(data, today))`), `components/RunwaySchedule.tsx` (prop `result: IRunwayResult`), `RunwayPage.test.tsx` (seed uses `recurringIncome`)
- Delete: `components/DepositsEditor.tsx`, `components/DepositsEditor.test.tsx`
- Modify: `testUtils/pageRoundTrip.tsx` (drop `deposits: []` from `liveShapedFile`)

**Interfaces:**
- Produces: `HORIZON_MONTHS = 120`; `calculateRunway(data: IRunwayData, today: Temporal.PlainDate, horizonMonths?: number): IRunwayResult`, where `IRunwayResult = { startingBalance: number; scheduled: IScheduledTransaction[]; runwayEndDate: Temporal.PlainDate | null; stoppedAtName: string | null; lowestBalance: { amount: number; date: Temporal.PlainDate }; payoffs: IDebtPayoff[] }`. `lowestBalance` is the first minimum among the starting balance (dated today) and the balance after each row. `payoffs` lists debt-type payments in file order.
- Produces: `parseRunwayData(text: string): IRunwayData` (requires `cashOnHand` and `payments` arrays; an absent `recurringIncome` or `expectedInflows` becomes `[]`; if present but not an array, throws `Invalid runway.json: "<field>" must be an array.`; every other key is untouched) and `serializeRunwayData(data: IRunwayData): string`, which ends in `'\n'`.

- [ ] **Step 1: Write the failing tests.** In `runwayEngine.test.ts`, with today 2026-11-16:
  - cash 500 and 250.5 give `startingBalance` 750.5, no rows, `runwayEndDate` null, and lowest balance 750.5 today;
  - cash 0, monthly income 1000 on `[1]` and rent 900 on day 1, over 3 months: the first rows are Dec 1 +1000 then Dec 1 -900, and nothing stops;
  - cash 100 and rent 1200 on day 1: it stops at `'Rent'`, with `runwayEndDate` 2026-11-30;
  - cash 0, semi-monthly 2000 and rent 1500 on day 2: `runwayEndDate` null;
  - cash 1000 and a collection of 100 on day 20 with balance 300: rows on Nov 20, Dec 20 and Jan 20, the last flagged `paidOff`, and `runwayEndDate` null;
  - cash 800, a bill of 800 on day 31, and a confirmed inflow of 900 for `'2026-12'`: a 2026-12-31 Bonus +900 row, stopped at `'Bill'`, `runwayEndDate` 2027-01-30. When unconfirmed, `runwayEndDate` is 2026-12-30;
  - cash 1000, monthly income 600 on `[20]` and rent 900 on day 18: lowest balance 100 on 2026-11-18;
  - a utility, a card with balance 5000 (no rate) and a collection of 100 on day 20 with balance 300: payoffs `[{ name: 'Card', projection: { status: 'missingValues', fields: ['interestRate'] } }, { name: 'Plan', projection: { status: 'paidOff', ... 2027-01-20 } }]`;
  - an `amount: 0` payment with no plan: no rows;
  - open-ended semi-monthly income with `horizonMonths` 3: every row is on or before 2027-02-16.

  In `runwayFileIO.test.ts`:
  - a file without `recurringIncome` or `expectedInflows` parses with both as `[]`;
  - `"recurringIncome": {}` throws `"recurringIncome" must be an array` (Review Focus 4);
  - a missing `payments` throws `"payments" must be an array`;
  - an unknown top-level key survives a parse and serialize;
  - the serialized text ends with `'\n'`.

  Add `expect(saved.endsWith('\n')).toBe(true)` to the round-trip test.
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway`. Expected: the new engine and IO cases FAIL.
- [ ] **Step 3: Implement** `calculateRunway`, porting the CLI's `generateTransactionSchedule`. Its deposits are `generateIncomeDeposits` plus `generateInflowDeposits`, merged and sorted. Deposits dated on or before a payment are applied first; a debt row's amount is what `applyPayment` actually took. Then update the IO, the page and the schedule component, and delete the deposits editor.
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`, then `npx tsc -b` and `npm run lint`. Expected: all PASS, including the round-trip test with no `deposits` key.
- [ ] **Step 5: Commit.** `feat: run the runway page on the debt-aware engine and the current file schema`

### Task 5: Recurring income editor

**Files:**
- Create: `components/RecurringIncomeEditor.tsx`, `components/RecurringIncomeEditor.test.tsx`
- Modify: `RunwayPage.tsx` (an Income section after Cash on Hand), `RunwayPage.test.tsx` (assert the income row renders)

**Interfaces:**
- Produces: the default export `RecurringIncomeEditor({ items: IRecurringIncome[]; onChange: (items: IRecurringIncome[]) => void })`. Each row has name, amount (blank gives `0`), a native-select schedule, and days as text (`'1, 15'`), committed on blur from local text state. "Add Income" adds `{ name: '', amount: 0, schedule: 'semi-monthly', days: [1, 15] }`.

- [ ] **Step 1: Write the failing tests:**
  - it renders `Salary`, `2500` and `1, 15`;
  - typing `5, 20` in days and blurring calls `onChange` with `days: [5, 20]`, keeping an unknown `employer` key;
  - typing `x` reverts the text to `1, 15`, and `onChange` never receives empty `days`;
  - "Add Income" appends the default row;
  - Remove drops the row.
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/components/RecurringIncomeEditor.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the editor and wire it into the page.
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`, then `npx tsc -b` and `npm run lint`. Expected: PASS. The round-trip test now tabs through the income fields as well.
- [ ] **Step 5: Commit.** `feat: edit recurring income on the runway page`

### Task 6: Expected inflows editor

**Files:** Modify `components/ExpectedInflowsEditor.tsx`, `components/ExpectedInflowsEditor.test.tsx`.

**Interfaces:** Props are unchanged. Amount blank gives `null`. Date blank gives `null`, never `''`. Expected month is a plain text field (placeholder `YYYY-MM`) whose blank gives `null`. Confirmed is an MUI checkbox.

- [ ] **Step 1: Write the failing tests:**
  - clearing amount, then blurring, gives `amount: null`;
  - clearing the date gives `date: null`;
  - tabbing through `expectedMonth: '~2031'` leaves it `'~2031'`;
  - clicking confirmed flips it;
  - unknown `gross` and `note` keys survive;
  - all fixtures are generic.
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/components/ExpectedInflowsEditor.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`, then `npx tsc -b` and `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit.** `feat: edit inflow confirmation and expected month on the runway page`

### Task 7: Payments editor

**Files:** Modify `components/PaymentsEditor.tsx`, `components/PaymentsEditor.test.tsx`.

**Interfaces:**
- The type field is a native select listing `utility, insurance, living, subscription, creditCard, personalLoan, unsecured, secured, mortgage, collection`, plus a blank option. The current value is always an option, so an unlisted type survives.
- Balance and interest rate appear when `isDebtType(type)`; escrow appears only for `mortgage`. Each one, left blank, removes its key.
- A payment plan renders read-only as `Plan: $450.00 on 3 dates, last 2026-12-06`.

- [ ] **Step 1: Write the failing tests:**
  - a `creditCard` shows balance and interest rate, while a `utility` shows neither;
  - escrow shows only for a mortgage;
  - clearing balance gives a payload with no `balance` key (Review Focus 1);
  - typing `22.5` as the interest rate gives `interestRate: 22.5`;
  - the plan text renders, and the plan survives a name edit;
  - an unlisted type survives a tab-through;
  - removing the first row leaves the second row's unknown keys intact;
  - all fixtures are generic.
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/components/PaymentsEditor.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`, then `npx tsc -b` and `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit.** `feat: edit debt type, balance, interest rate and escrow on the runway page`

### Task 8: Summary and schedule window

**Files:**
- Create: `components/RunwaySummary.tsx`, `components/RunwaySummary.test.tsx`
- Modify: `components/RunwaySchedule.tsx`, `components/RunwaySchedule.test.tsx`, `RunwayPage.tsx`, `RunwayPage.test.tsx`

**Interfaces:**
- `RunwaySummary({ result: IRunwayResult })` renders:
  - the runway line: `Runway ends 2027-01-30, before Bill`, or `Runway extends beyond 10 years`;
  - `Lowest balance: $100.00 on 2026-11-18`;
  - a `Debt payoff, if every payment is made` list, shown only when there are payoffs. Its lines are `Card: paid off 2027-01-20`, `Card: never at the current payment`, `Card: beyond 10 years` and `Card: needs interest rate, escrow`, using the field labels `balance`, `interest rate` and `escrow`.
- `RunwaySchedule({ result: IRunwayResult; today: Temporal.PlainDate })`:
  - shows rows dated up to `today + 90 days`;
  - offers a `Show all (N more)` button when rows are hidden, which toggles to `Show next 90 days`;
  - computes the running balance over every row;
  - the runway-end line moves out of this component.

- [ ] **Step 1: Write the failing tests:**
  - each summary string above;
  - the schedule hides rows past 90 days, "Show all" reveals them, and every running balance equals the previous balance plus that row's amount.
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/components/RunwaySummary.test.tsx src/pages/runway/components/RunwaySchedule.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement,** and render the summary above the schedule in `RunwayPage`.
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`, then `npx tsc -b` and `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit.** `feat: show runway summary, lowest balance and payoff dates`

### Task 9: Generic data everywhere, and guards

**Files:** Modify `components/CashOnHandEditor.test.tsx`, any other runway test the leak check flags, `docs/superpowers/plans/2026-09-08-runway-webpage.md` (code samples only), `.gitignore`, `CLAUDE.md`.

- [ ] **Step 1: Run the local leak check.** Build a pattern list from the real data file and its git history, outside this repo (names, plus amounts with cents or of 1,000 or more), then grep `src/pages/runway`, `docs/superpowers` and `CLAUDE.md` with it. Expected: a list of hits to replace. Never commit the pattern list.
- [ ] **Step 2: Replace every hit** with a generic name or a round number, keeping each test's arithmetic consistent.
- [ ] **Step 3: Add `runway.json` to `.gitignore`,** and add a CLAUDE.md section: "Runway page: fixtures and examples are always made up. Never copy a real runway.json into this repo; the real file lives outside it and reaches local checks only through `RUNWAY_FILE`."
- [ ] **Step 4: Verify.** Re-run the leak check: 0 hits. `git check-ignore -v runway.json` names `.gitignore`. Then `npx vitest run`, `npx tsc -b` and `npm run lint`: PASS.
- [ ] **Step 5: Commit.** `chore: keep runway fixtures and docs on generic sample data`

### Task 10: Local-only check against the real file

**Files:** Create `src/pages/runway/realFile.check.test.ts`.

**Interfaces:** Consumes `saveWithoutEdits` (Task 1), `parseRunwayData` and `calculateRunway` (Task 4).

- [ ] **Step 1: Write the test.** `describe.skipIf(!process.env.RUNWAY_FILE)`. It reads the file with `readFileSync`, asserts that `calculateRunway(parseRunwayData(text), Temporal.Now.plainDateISO())` returns a numeric `startingBalance`, and asserts `JSON.parse(await saveWithoutEdits(text))` deep-equals `JSON.parse(text)`. It logs a one-line summary (runway end or "beyond 10 years", the lowest balance, and each payoff status) with `console.info`. Use a 60-second timeout.
- [ ] **Step 2: Run without the variable.** `npx vitest run src/pages/runway/realFile.check.test.ts`. Expected: skipped.
- [ ] **Step 3: Run against the real file.** `RUNWAY_FILE=<path> npx vitest run src/pages/runway/realFile.check.test.ts`. Expected: PASS, and the real file is unchanged (compare checksums before and after).
- [ ] **Step 4: Commit.** `test: add a local-only check that the real runway file survives the page`

### Task 11: Full verification and PR

- [ ] **Step 1:** `npx vitest run` (all pass), `npm run lint` (clean), `npm run build` (exit 0, `/runway` prerendered).
- [ ] **Step 2:** Run the leak check over the lines this branch adds: `git diff origin/master...HEAD | grep '^+'` piped into the pattern list. Expected: 0 hits.
- [ ] **Step 3:** `git push -u origin feature/runway-single-engine`, then `gh pr create --base master`. Write the description in neutral terms: what changed, how it was verified, and that merging deploys the page.
