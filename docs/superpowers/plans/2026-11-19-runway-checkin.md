# Runway Check-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `/runway` around the check-in routine (Check-in tab, summary cards, MUI form conventions) and replace the Save button with debounced automatic saving in which outside edits always win.

**Architecture:** Pure helpers for formatting (`format.ts`) and the 60-day window (`engine/window.ts`) feed new display components. The file hook owns saving: a debounced write, a permission request at open, and polling that reloads outside edits. The page becomes a header, summary cards and four tabs, and the existing Formik editors are restyled in place.

**Tech Stack:** React 19, TypeScript 5.7 (`lib: ES2020`), MUI 7, Formik + Yup, `@js-temporal/polyfill`, vitest 5 + Testing Library (fake timers for saving).

**Spec:** `docs/superpowers/specs/2026-11-19-runway-checkin-design.md`

## Global Constraints

- **Public repo:** no real financial data in any file, commit message or PR text. Fixtures use generic names and round numbers.
- **ES2020 only:** no `Object.hasOwn` and no `Array.prototype.at`. Temporal comes from `@js-temporal/polyfill`.
- **Naming:** `I`/`T` prefixes; components default-export at the bottom of their file.
- **Constants** (exported where they are defined):
  - `SAVE_DELAY_MS = 1000` and `POLL_INTERVAL_MS = 2000` in the file hook;
  - `STALE_AFTER_DAYS = 7` in `format.ts`;
  - `CHECK_IN_DAYS = 60` in `engine/window.ts`.
- **Saved text:** unchanged, `JSON.stringify(data, null, 2) + '\n'`. A session with no edits never writes.
- **Before every commit:** `npx vitest run`, `npx tsc -b` and `npm run lint` all pass.

## Review Focus

1. **Bursts of changes write once.** A change committed by a blur, followed by another within the delay, writes once with the latest data, and the second change is never lost. Test: Task 3.
2. **Outside edits are never missed.** An outside edit that lands just after the page's own write is detected and loaded, not mistaken for the page's write. After writing, the hook compares the file's text with what it wrote. Test: Task 3.
3. **Tab switches keep edits.** An edit followed directly by a tab switch is kept, because the blur commits before the panel unmounts. Test: Task 7.
4. **Declined permission keeps edits.** If permission is declined, edits stay on screen, the browser warns before leaving, and "Allow" saves them. Test: Task 3.
5. **An unreadable outside version blocks saving.** The page stops saving until a readable version arrives, and that version wins. Test: Task 3.

---

### Task 1: Formatting helpers

**Files:** Create `src/pages/runway/format.ts`, `src/pages/runway/format.test.ts`.

**Interfaces (produces):**
- `formatMoney(amount: number): string` gives `$1,525.00`.
- `formatWholeMoney(amount: number): string` gives `$1,525`.
- `formatSignedMoney(amount: number): string` gives `+$2,500.00`, `-$1,800.00`, and `$0.00` for zero.
- `formatShortDate(date: Temporal.PlainDate, today: Temporal.PlainDate): string` gives `Dec 1`, with `, 2027` added when the year differs from today's.
- `formatLongDate(date: Temporal.PlainDate): string` gives `Jan 20, 2027`.
- `STALE_AFTER_DAYS = 7`.
- `describeUpdated(updatedAt: unknown, today: Temporal.PlainDate): { text: string; stale: boolean }` gives one of:
  - `Updated today` or `Updated yesterday`;
  - `Updated N days ago`;
  - `Not dated`, for a missing or unparseable value.

  It is stale after more than 7 days or when not dated. A future date reads as today.
- `paymentTypeLabel(type: string | undefined): string`:
  - known types map to readable labels: utility gives Utility, insurance Insurance, living Living, subscription Subscription, creditCard Credit card, personalLoan Personal loan, unsecured Unsecured loan, secured Secured loan, mortgage Mortgage, collection Collection;
  - an unknown type is returned as is;
  - an empty or missing type gives `No type`.
- `formatClockTime(at: Date): string` gives `7:02 AM`.
- `parseMoneyInput(text: string): number | null` strips `$`, commas and spaces. Empty or invalid text gives null.
- `formatMoneyInput(amount: number): string` gives `1,200.00`.

- [ ] **Step 1: Write failing tests.** Cover each example above. Also:
  - `describeUpdated` for 0, 1, 7 and 8 days ago (stale only at 8), for `undefined`, `''` and `'garbage'`, and for tomorrow;
  - `parseMoneyInput` for `'$1,200.50'`, `' 300 '`, `''` and `'abc'`;
  - `formatSignedMoney(0)`.
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/format.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement.** Money uses `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`. Dates use a fixed month-name array; `toLocaleString` is not used for dates.
- [ ] **Step 4: Run.** Expected: PASS. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: add runway formatting helpers`

### Task 2: The 60-day window

**Files:** Create `src/pages/runway/engine/window.ts`, `window.test.ts` (same folder).

**Interfaces (produces):**
- `CHECK_IN_DAYS = 60`.
- `interface IWindowRow { transaction: IScheduledTransaction; balance: number }`.
- `withRunningBalance(result: IRunwayResult): IWindowRow[]`: the balance after each row, rounded to cents, starting from `result.startingBalance`.
- `scheduleWindow(result: IRunwayResult, today: Temporal.PlainDate, days: number): { rows: IWindowRow[]; lowest: { amount: number; date: Temporal.PlainDate }; endsInWindow: boolean }`:
  - `rows` are the rows dated on or before `today + days`;
  - `lowest` is the first minimum among the starting balance (dated today) and those rows' balances;
  - `endsInWindow` means `runwayEndDate` is set and falls on or before `today + days`.

- [ ] **Step 1: Write failing tests:**
  - a row exactly on `today + 60` is included, and the next day's is not;
  - the lowest takes the first of two equal minima;
  - with no rows, the lowest is the starting balance dated today;
  - `endsInWindow` is true for an end inside the window and false for one after it or null;
  - balances are rounded (100.1 + 0.2 gives 100.3).
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/engine/window.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** with `roundToCents` from `engine/money.ts`.
- [ ] **Step 4: Run.** Expected: PASS. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: compute the runway's 60-day check-in window`

### Task 3: Automatic saving and outside edits in the file hook

**Files:**
- Create `src/pages/runway/testUtils/fakeFileHandle.ts`.
- Rewrite `src/pages/runway/hooks/useRunwayFile.ts`.
- Create `src/pages/runway/hooks/useRunwayFile.test.tsx`.

**Interfaces (produces):**
- `type TSaveStatus` is one of:
  - `{ kind: 'saved'; at: Date | null }`;
  - `{ kind: 'saving' }`;
  - `{ kind: 'error'; message: string }`;
  - `{ kind: 'updatedFromDisk'; at: Date }`;
  - `{ kind: 'readOnly' }`;
  - `{ kind: 'unreadable' }`.
- `SAVE_DELAY_MS = 1000` and `POLL_INTERVAL_MS = 2000`.
- The hook returns `{ data; error; fileName; saveStatus: TSaveStatus | null; open(): Promise<void>; update(next: IRunwayData): void; retrySave(): Promise<void>; allowSaving(): Promise<void> }`:
  - `update` replaces today's `setData`;
  - `open` replaces `load`;
  - `saveStatus` is null until a file is open.
- `open()`:
  - shows the existing Brave and unsupported-browser messages unchanged;
  - picks the file, then calls `requestPermission({ mode: 'readwrite' })` when the handle has it (a missing method counts as granted);
  - reads and parses the file, and records `lastModified`;
  - sets the status to saved with a null time, or to readOnly.
- `update()`:
  - sets the data;
  - unless the status is readOnly or unreadable, marks the data dirty, sets the status to saving, and restarts a `SAVE_DELAY_MS` timer;
  - a version counter makes a newer change survive a write already in progress.
- **The write path:**
  - It first reads `getFile()`. If `lastModified` changed, it loads that version instead of writing; outside edits win.
  - Otherwise it writes with `createWritable`, then `write`, then `close`, aborting on failure.
  - It then re-reads the file. If the text differs from what it wrote, it loads that version. Otherwise it records `lastModified` and, if no newer change arrived, sets the status to saved with the current time.
  - A failure sets the status to error.
- **Polling:**
  - every `POLL_INTERVAL_MS` while `document.visibilityState === 'visible'`, and immediately on becoming visible or on window `focus`, it compares `lastModified`;
  - on a change, it cancels any pending save, then parses and replaces the data, setting the status to updatedFromDisk;
  - a parse failure sets the status to unreadable and blocks saving until a readable version loads.
- **Leaving the page:**
  - when the tab is hidden, a pending save is written immediately;
  - `beforeunload` calls `preventDefault` while there is an unsaved change.
- `retrySave()` writes now. `allowSaving()` requests permission (the click supplies the gesture); when granted, it saves any unsaved change, otherwise it leaves the status saved.
- **The fake file** (`testUtils/fakeFileHandle.ts`): `createFakeFile(text: string, options?: { permission?: PermissionState })` returns `{ handle; writes: string[]; currentText(): string; editOutside(text: string): void; failNextWrite(): void }`.
  - `lastModified` starts at 1000 and goes up by 1 on every write and outside edit.
  - `stubFilePicker(file)` stubs `showOpenFilePicker`.

- [ ] **Step 1: Write failing tests** with `renderHook`, `vi.useFakeTimers()` and `await act(() => vi.advanceTimersByTimeAsync(ms))`:
  - opening shows the data, and the status is saved with a null time;
  - one update writes once after 1000 ms (none at 999), with the status saved and a time;
  - two updates 500 ms apart write once, 1000 ms after the second, with the second's data (Review Focus 1);
  - with no update, no write happens after 10 s of polling;
  - a failed write gives an error status, and `retrySave` writes and gives saved;
  - declined permission gives readOnly: an update makes no write, `beforeunload` is prevented, and `allowSaving` (now granted) writes the change (Review Focus 4);
  - an outside edit is loaded within 2000 ms with the status updatedFromDisk;
  - an update followed by an outside edit before the timer fires leaves the outside text in the file, the outside data on screen, and no write;
  - the page's own write is not reloaded on the next poll;
  - an outside edit that lands right after the page's write is loaded (Review Focus 2);
  - an unreadable outside version gives the status unreadable, an update makes no write, and a later readable version loads (Review Focus 5);
  - hiding the tab while a save is pending writes immediately.
- [ ] **Step 2: Run and see them fail.** `npx vitest run src/pages/runway/hooks/useRunwayFile.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement the hook.** In `RunwayPage.tsx`, change only the call site so it still compiles: `update` replaces `setData`, `open` replaces `load`, and the Save button is removed. Task 7 rebuilds the page.
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`. Expected: the hook tests pass. The page tests that click Save are updated in Task 7, so for now mark them `it.todo` with a ledger ruling. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: save the runway file automatically and let outside edits win`

### Task 4: Save status chip

**Files:** Create `components/SaveStatusChip.tsx` and `components/SaveStatusChip.test.tsx`.

**Interfaces:**
- **Consumes:** `TSaveStatus` (Task 3) and `formatClockTime` (Task 1).
- **Produces:** the default export `SaveStatusChip({ status, onRetry, onAllow })`. It renders inside a `role="status"` element. The chip text for each status:
  - **saved:** `Saved`, or `Saved 7:02 AM` with a time;
  - **saving:** `Saving…`;
  - **error:** `Couldn't save`, with a Retry button;
  - **updatedFromDisk:** `Updated from disk 7:05 AM`;
  - **readOnly:** `Saving is off`, with an Allow button;
  - **unreadable:** `Can't read the file's new version`.

- [ ] **Step 1: Write failing tests:**
  - each status shows its text;
  - Retry calls `onRetry` and Allow calls `onAllow`;
  - the text sits inside the `role="status"` element.
- [ ] **Step 2: Run and see them fail.** Expected: FAIL.
- [ ] **Step 3: Implement** with an MUI `Chip`, colored by status (success, info, error, warning).
- [ ] **Step 4: Run.** Expected: PASS. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: show the runway save status`

### Task 5: Summary cards and the Next 60 days card

**Files:**
- Create `components/SummaryCards.tsx`, `components/NextDaysCard.tsx` and their tests.
- Delete `components/RunwaySchedule.tsx` and its test, after porting the Show-all test into `NextDaysCard.test.tsx`.

**Interfaces:**
- **Consumes:** `scheduleWindow`, `withRunningBalance` and `CHECK_IN_DAYS` (Task 2), and the formatters (Task 1).
- **Produces `SummaryCards({ result, accountCount, today })`:** three `Paper` cards on a `Grid` (12 columns on xs, 4 on md):
  - **Cash now:** `formatWholeMoney(startingBalance)`, plus `N accounts` from `accountCount`.
  - **Lowest, next 60 days:** the window low and its short date.
  - **Runway:** either `10+ years` with `No shortfall ahead`, or `Ends Jan 30` with `before Bill`. When `result.lowestBalance.amount` is below the window low, a third line reads `Lowest later: $310 on Apr 3`.
- **Produces `NextDaysCard({ result, today })`:**
  - a `Paper` holding a sticky-header table capped at 420px with internal scrolling;
  - columns Date (short date), Name, Amount (signed money, `success.main` for money in and `error.main` for money out) and Balance;
  - the window-low row highlighted and labeled `low`;
  - a `Runway ends <long date>, before <name>` line when `endsInWindow`;
  - a `Show all` button that switches to every row, and `Show next 60 days` to switch back.

- [ ] **Step 1: Write failing tests:**
  - each card's text in both runway states;
  - "Lowest later" only when the whole-horizon low is lower;
  - the window rows only, with the low row labeled;
  - the end line inside the window;
  - the ported Show-all toggle;
  - every running balance equals the previous one plus the row's amount.
- [ ] **Step 2: Run and see them fail.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: add the runway summary cards and the next 60 days card`

### Task 6: Balances card with account dialogs

**Files:**
- Create `components/BalancesCard.tsx` and `components/BalancesCard.test.tsx`.
- Modify `types/IRunwayData.ts` to add `updatedAt?: string | null` to `ICashOnHandEntry`.
- Delete `components/CashOnHandEditor.tsx` and its test, after porting their behaviors.

**Interfaces:**
- **Consumes:** `describeUpdated`, `parseMoneyInput` and `formatMoneyInput` (Task 1).
- **Produces `BalancesCard({ items, onChange, today })`.** Each row has:
  - the name as text, with the institution in secondary text;
  - the `describeUpdated` line, in `warning.main` when stale;
  - a labeled `Balance` field with a `$` adornment. It keeps local text and commits on blur only when the parsed amount differs. The commit is `onChange` with `{ ...entry, amount, updatedAt: today.toString() }`. Unparseable text puts the previous value back.
  - a `Mark <name> as checked` icon button, calling `onChange` with only `updatedAt` set to today;
  - a `More for <name>` menu with Rename and Delete.

  Below the rows:
  - **Add account** opens a dialog with a required Name and a Balance. Add stays disabled until the name is non-blank, and adds `{ name, amount, updatedAt: today }`.
  - **Rename** opens the same dialog with Name only.
  - **Delete** asks `Delete <name>?` before removing.
  - Every edit spreads the original entry, so unknown keys survive.

- [ ] **Step 1: Write failing tests:**
  - tabbing through a balance makes no `onChange`;
  - a new amount commits the amount with today's date and keeps an unknown key;
  - unparseable text restores the previous value;
  - Mark as checked changes only `updatedAt`;
  - Add stays disabled with a blank name, and a named account is added with today's date;
  - Rename changes only `name`;
  - Delete asks first, then removes, keeping the other rows' unknown keys;
  - stale rows read amber text (by the `describeUpdated` line).
- [ ] **Step 2: Run and see them fail.** Expected: FAIL.
- [ ] **Step 3: Implement** with MUI `TextField`, `InputAdornment`, `IconButton`, `Menu`, `Dialog` and `Tooltip`.
- [ ] **Step 4: Run.** Expected: PASS. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: add the runway balances card`

### Task 7: Page shell, Payoff tab and page-level safety tests

**Files:**
- Rewrite `RunwayPage.tsx`.
- Create `components/PayoffList.tsx` and its test. Delete `components/RunwaySummary.tsx` and its test, after porting the payoff wording.
- Rewrite `testUtils/pageRoundTrip.tsx`.
- Update `RunwayPage.test.tsx`, `RunwayPage.roundTrip.test.tsx`, `RunwayPage.engineCalls.test.tsx`, `RunwayPage.engineError.test.tsx`, `RunwayPage.browserSupport.test.tsx` and `realFile.check.test.ts`.

**Interfaces:**
- **Consumes:** everything above.
- **`PayoffList({ payoffs })`:** one row per debt with a `Chip`:
  - `Paid off Jan 20, 2027` (long date);
  - `Never at current payment`;
  - `Beyond 10 years`;
  - `Needs interest rate, escrow`.

  With no payoffs, it shows `No debts with balances on file`.
- **The page, before a file is open:** a `Paper` empty state with the `Open runway.json` button and the error `Alert`.
- **The page, once a file is open:**
  - **header:** title, file `Chip`, an `Open a different file` icon button and `SaveStatusChip`;
  - the calculation-error `Alert` (try/catch kept), then `SummaryCards`;
  - **`Tabs`:** `Check-in` (default) | `Income` | `Bills & debts` | `Payoff`. Only the active panel is rendered.
- **The panels:**
  - **Check-in:** `Grid` with `BalancesCard` (md 5) and `NextDaysCard` (md 7);
  - **Income:** `RecurringIncomeEditor` and `ExpectedInflowsEditor`, each in a `Paper`;
  - **Bills & debts:** `PaymentsEditor` in a `Paper`;
  - **Payoff:** `PayoffList`.
- The JSON-compare no-op `update` wrapper stays.
- **Round-trip helpers (`pageRoundTrip.tsx`):** keep `liveShapedFile`.
  - `openInPage(fileText)` renders `RunwayApp` with fake timers and a fake file, and returns `{ user, file }`.
  - `visitEveryTabAndField(user)` clicks each tab and tabs through every focusable element in its panel.

- [ ] **Step 1: Write failing tests:**
  - **round trip:** visiting every tab and field, then advancing 5 s, leaves `file.writes` empty;
  - **one balance:** changing it writes once, deep-equal to the original except that amount and that account's `updatedAt`;
  - **tab switch (Review Focus 3):** an edit in Income followed immediately by a click on the Payoff tab is saved;
  - **engine calls:** `calculateRunway` runs once across a full visit;
  - **engine error:** the Alert shows and the balances are still on screen;
  - **browser support:** the Brave message tests are unchanged;
  - **integration:** open, then check the cards and the 60-day rows, change a balance, and confirm the low point updates;
  - **real-file check:** a full visit makes no writes.
- [ ] **Step 2: Run and see them fail.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`. Expected: PASS, with no `it.todo` left from Task 3. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `feat: rebuild the runway page around the check-in tab`

### Task 8: Restyle the editors

**Files:** Modify `components/RecurringIncomeEditor.tsx`, `components/ExpectedInflowsEditor.tsx` and `components/PaymentsEditor.tsx`, plus their tests.

**Interfaces:** props are unchanged.
- **Labels:** each field gets an MUI `label` equal to its old placeholder text. The days field is labeled `Days`, with helper text `e.g. 1, 15`; the expected month is labeled `Expected month`, with placeholder `YYYY-MM`.
- **Adornments:** `$` on Amount, Balance and Escrow, and `%` on Interest rate.
- **Errors:** Yup errors appear as `helperText` with `error` once a field is touched.
- **Layout:**
  - rows are aligned on a `Grid`, with creditor and note on a second line in Payments;
  - add buttons are left-aligned with an add icon.
- **The type select** shows `paymentTypeLabel(value)` while storing the raw value.

- [ ] **Step 1: Update and add tests:**
  - placeholder queries become label queries;
  - a cleared Name shows `Name is required` after blur, in each editor;
  - the type select shows `Credit card` and stores `creditCard`;
  - the `%` and `$` adornments are present.
- [ ] **Step 2: Run and see the new ones fail.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** `npx vitest run src/pages/runway`. Expected: PASS, including the round-trip tests. Then `npx tsc -b` and `npm run lint`: clean.
- [ ] **Step 5: Commit.** `style: give the runway editors labels, adornments and visible errors`

### Task 9: Verification and PR

- [ ] **Step 1: Full checks.** `npx vitest run`, `npm run lint` and `npm run build`: all pass, with `/runway` prerendered.
- [ ] **Step 2: Leak check.** Build the pattern list from the real data file outside the repo, check every line the branch adds and every commit message, then delete the list. Expected: no hits beyond generic words.
- [ ] **Step 3: Real-file check.** `RUNWAY_FILE=<path> npx vitest run src/pages/runway/realFile.check.test.ts`. Expected: PASS, with the file's checksum unchanged.
- [ ] **Step 4: Ship.** `git push -u origin feature/runway-checkin`, then open a draft PR in neutral terms that notes merging deploys the page.
