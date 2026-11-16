# Runway: One Engine, One Data File

## Intent

The `/runway` page becomes the only way to use the runway calculator. The standalone CLI
(`jlaustill/runway`) is retired. Its engine (debt payoff with daily interest, payment plans,
mortgage escrow, payoff projection) moves into this page and replaces the page's own engine,
which had diverged from it. The page must open the owner's existing data file exactly as it is
today and write it back without losing anything, because that file is the only copy of the
data and this page becomes the only thing that edits it.

## Goals

- One engine, in `src/pages/runway/engine/`, used only by this page.
- The page opens the current data file with no migration, and a save with no edits changes
  nothing in meaning (the parsed result is deep-equal to what was opened).
- The page understands what the file actually holds today: income paid on fixed days of the
  month, future inflows that may only have an expected month, and debts with balances and
  interest rates.
- Every fixture, example and document in this repo uses made-up data.

## Non-goals

- No CLI, no published package, no second copy of the engine anywhere.
- No backend. The file never leaves the browser; the File System Access API flow (open, edit,
  save to the same file, Chromium only) stays as it is.
- No editing of payment plans in this version. Plans are shown read-only and preserved on save.
- No every-14-days (biweekly) income schedule yet.
- No business-day adjustment of paydays.
- No rewriting of git history.

## Anti-goals (failure even if everything else works)

- A save that drops, renames or retypes any field, including fields the page never displays.
- Real financial data in any committed file, commit message or PR text.
- The engine counting money that is not certain: unconfirmed inflows, inflows with no amount,
  or inflows dated in the past.

## Constraints

- This repo is public. The data file lives outside it and is never copied in; `.gitignore`
  carries `runway.json` as a guard.
- `tsconfig.app.json` targets `lib: ES2020`, and it type-checks tests too. Ported code cannot
  use `Object.hasOwn` or `Array.prototype.at`.
- Temporal comes from `import { Temporal } from '@js-temporal/polyfill'`. The CLI relied on
  Node's flag-gated global and a hand-written `temporal.d.ts`, which do not come across.
- The page is prerendered; `RunwayPage` renders `RunwaySkeleton` server-side and the engine
  only ever runs in the browser.
- Repo conventions: `I`/`T`/`E` prefixes for interfaces/types/enums, default exports at the
  bottom of component files, Formik + Yup editors, MUI, vitest + Testing Library.
- CI runs `npm run build` only (which includes `tsc -b` and the prerender). Tests and lint must
  be run locally before pushing.

## Approaches

1. **Port the CLI engine into the page (chosen).** One working copy. The CLI engine is the more
   complete of the two and has the harder logic, with tests. The page engine's improvements fold
   into it: a time limit on open-ended income (the CLI hangs on income with no end date), the
   ISO weekday lookup (the CLI parses a locale string), and dated one-time inflows. Two page
   features are dropped: the deposit `occurrences` count (`endDate` covers it), and the one-off
   reinstatement rule (`reinstatementDue`, `revertsToMonthlyPayment`, plus its use of
   `shouldBe`), which nothing in the current data uses. Its test goes with it.
2. **Publish the CLI engine as a package the page imports.** Rejected: two working copies and a
   release step, for a single-user tool.
3. **Grow the page's own engine to add the debt model.** Rejected: rebuilds the harder half that
   already exists and is tested.

## Data model

The file's existing schema is the contract; the engine conforms to it.

Top level: `cashOnHand[]` and `payments[]` are required arrays. `recurringIncome[]` and
`expectedInflows[]` are optional and treated as empty when absent. Keys the page does not know,
at any level, are preserved untouched. The old `deposits` list is no longer read.

| Entry | Fields the engine reads | Notes |
|---|---|---|
| cash on hand | `name`, `amount` | starting balance is the sum |
| recurring income | `name`, `amount`, `schedule`, `days`, optional `startDate`, `endDate` | `schedule` is `semi-monthly`, `monthly` or `weekly`; `days` are days of the month (clamped to short months) or ISO weekdays 1 to 7 for `weekly` |
| expected inflow | `name`, `amount` (number or null), `date` (YYYY-MM-DD or null), `expectedMonth` (free text), `confirmed` | see rules below |
| payment | `name`, `amount`, `day`, optional `type`, `balance`, `interestRate`, `escrow`, `paymentPlan` | `interestRate` is the annual percentage as printed: `24.99` means 24.99%. `escrow` is mortgage only. `paymentPlan` is `{ amount, dueDates[] }`; any other plan keys are preserved and ignored |

A synthetic example:

```json
{
  "cashOnHand": [{ "name": "Checking", "amount": 1200, "institution": "Example Bank" }],
  "recurringIncome": [
    { "name": "Salary", "amount": 2500, "schedule": "semi-monthly", "days": [1, 15] }
  ],
  "expectedInflows": [
    { "name": "Bonus", "amount": 900, "date": null, "expectedMonth": "2027-03", "confirmed": true },
    { "name": "Maybe later", "amount": null, "date": null, "expectedMonth": "~2031", "confirmed": false }
  ],
  "payments": [
    { "name": "Power", "amount": 120, "day": 3, "type": "utility" },
    { "name": "Card", "amount": 300, "day": 9, "type": "creditCard", "balance": 4000, "interestRate": 22 },
    { "name": "Home", "amount": 1800, "day": 1, "type": "mortgage", "balance": 150000, "interestRate": 6, "escrow": 450 },
    {
      "name": "Store plan", "amount": 0, "day": 12, "type": "collection", "balance": 600,
      "paymentPlan": { "amount": 200, "dueDates": ["2027-01-12", "2027-02-12", "2027-03-12"] }
    }
  ]
}
```

## Engine behavior

- **Income.** Each recurring entry produces dated deposits from the later of today and
  `startDate`, through the earlier of `endDate` and the horizon. Paydays are not moved for
  weekends; modeling the later date is the conservative side.
- **Expected inflows.** Counted only when `confirmed` is `true` and `amount` is a positive
  number. The date is `date` when set, otherwise the last day of `expectedMonth` when it is
  exactly `YYYY-MM`. Anything else (no date, an approximate month like `~2031`, a date before
  today) is not counted. An empty-string date is treated as null.
- **Payments** (the CLI's rules, unchanged):
  - an `amount` of 0 with no remaining plan dates is not scheduled;
  - plan dates replace the regular payment until the last plan date, then the regular amount
    resumes on the regular day;
  - debt types and the values each needs before it can burn down: `creditCard`,
    `personalLoan`, `unsecured`, `secured` need `balance` and `interestRate`; `mortgage` also
    needs `escrow`; `collection` needs only `balance` (rate 0);
  - a debt with every value it needs accrues interest daily, its final payment is only what is
    left, and it drops out once paid (a mortgage keeps collecting escrow);
  - a debt missing a value, and anything that is not a debt, recurs every month for the whole
    horizon. That is the conservative answer.
- **Ordering and stopping.** Deposits dated on or before a payment's date are applied first.
  The first payment the balance cannot cover ends the runway on the day before it. The horizon
  is 120 months.
- **Outputs.** Schedule rows (date, name, signed amount, paid-off flag); starting balance; the
  runway end date and the payment it stopped at, or null for "beyond 10 years"; the lowest
  projected balance and its date; and for each debt, its payoff projection: paid off on a
  date, never at the current payment, beyond 10 years, or the names of the values it still
  needs.

## Page changes

- **Loading.** Stop requiring `deposits`. Require `cashOnHand` and `payments` to be arrays;
  default the two optional arrays to empty.
- **Saving.** `JSON.stringify(data, null, 2)` plus a trailing newline. The first save may expand
  a few one-line arrays; that is formatting only.
- **Editors.**
  - Cash on hand: unchanged.
  - Recurring income (replaces Deposits): name, amount, schedule, days (typed as `1, 15`).
  - Expected inflows: name, amount (blank means null, never 0), date (blank means null),
    expected month (plain text so approximate values survive), confirmed (checkbox).
  - Payments: adds type, balance, interest rate, and escrow for mortgages. A payment plan is
    shown read-only.
- **Summary.** Runway end (or "beyond 10 years"), lowest projected balance and date, and the
  payoff list.
- **Schedule table.** The next 90 days by default, with a "Show all" toggle.
- The "Loaded" line counts recurring income instead of deposits.

## Safety

- **The first test is a no-edit round trip through the real page**, with a stubbed file picker
  and a stubbed writable that captures what is saved. It loads a synthetic file shaped like the
  real one (null amounts and dates, an approximate month, unknown keys at every level, extra
  keys inside a payment plan, made-up account numbers), focuses and blurs every input, saves,
  and deep-compares the result with the original.
- **A local-only check against the real file**: a test that is skipped unless `RUNWAY_FILE` is
  set. It reads the real file in place, runs the engine, and asserts a no-edit round trip. It
  writes nothing and copies nothing into the repo.
- `.gitignore` gets `runway.json`; `CLAUDE.md` gets a rule that runway fixtures are always made up.
- Runway tests, and the code samples in the earlier runway plan document, use generic names and
  round numbers throughout.

## Left to the builder

- Layout and styling of the new editor fields, following the existing editors.
- Helper names and the file split inside `engine/`.
- Test cases beyond the ones named here.
