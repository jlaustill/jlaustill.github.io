# Runway: Check-in Layout and Automatic Saving

## Intent

The owner opens `/runway` for one routine: update account balances and read the next two months
of the runway. Today the page serves that badly. The answer (runway end, lowest balance) sits
below every editor on a page about 3,200px tall. Filled-in fields lose their names because they
use placeholders instead of labels. Numbers are unformatted, nothing shows how fresh a balance
is, and saving is a manual button with no feedback.

This change reorganizes the page around that routine using standard MUI patterns, and replaces
the Save button with automatic, debounced saving. Outside edits to the file always win.

## Goals

- A **Check-in** tab, open by default, holds exactly the routine: balances to update, and the
  next 60 days of the schedule.
- The headline numbers are visible without scrolling: cash now, the lowest balance in the next
  60 days, and the runway end.
- Every balance shows how long ago it was updated, so a stale balance is obvious before it
  skews the projection.
- Changes save themselves about a second after they are made, and a status chip always says
  whether the file is saved.
- An edit made to `runway.json` outside the page (by hand, or by a tool) replaces what the page
  shows within about 2 seconds, and is never overwritten by the page.
- Inputs follow MUI form conventions: visible labels, `$` and `%` adornments, validation errors
  shown under the field, and readable type names.

## Non-goals

- No charts. The chosen mockup has none; a chart can follow as its own change.
- No undo or history inside the page. The data file's repo history is the undo.
- No opening of several files, no dark mode, no new theme. The site theme stays as it is.
- No change to the engine or to the data-file schema, except that editing a balance updates
  that account's `updatedAt`.
- No new dependencies (no MUI X).

## Anti-goals (failure even if everything else works)

- A save that drops, renames or retypes any field. The existing round-trip guarantee still
  holds, and a session with no edits must now never write at all.
- The page overwriting an outside edit.
- A save that silently fails. Every failure is visible in the status chip.
- Real financial data in any committed file, commit message or PR text (unchanged rule).

## Constraints

- Same as the single-engine design: public repo, `lib: ES2020`, Temporal from
  `@js-temporal/polyfill`, prerendered page, `I`/`T`/`E` prefixes, Formik + Yup, MUI 7,
  vitest + Testing Library. CI only builds; test and lint locally.
- **File System Access API rules.** Writing needs read-write permission on the file handle.
  Requesting it needs a user gesture, and a timer-driven save has none, so permission is
  requested while handling the click that opens the file. The API has no change events in the
  browsers that matter, so outside edits are detected by polling the file's `lastModified`.
- Brave ships with the API off; the existing Brave message stays.

## Approaches

1. **Restyle in place (chosen).** Keep the Formik editors and their data-safety tests, move them
   into tabs and restyle them. Build the Check-in pieces new, and put automatic saving and file
   watching in the file hook. Least risk, because the tests that caught real data-loss bugs keep
   guarding every editor.
2. **Rebuild the editors without Formik.** One store and plain inputs fit autosave and reloading
   slightly better, but every editor and its tests would be rewritten. Rejected for risk.
3. **MUI X Data Grid for the long lists.** Spreadsheet editing for about 20 rows does not justify
   a large new dependency with its own editing model. Rejected.

## Layout

```
Runway  [runway.json] [⇄]                                [✓ Saved 7:02 AM]
┌ Cash now ──────┐ ┌ Lowest, next 60 days ┐ ┌ Runway ─────────────┐
│ $1,525         │ │ $1,340               │ │ 10+ years           │
│ 3 accounts     │ │ Dec 12               │ │ No shortfall ahead  │
└────────────────┘ └──────────────────────┘ └─────────────────────┘
 CHECK-IN │ INCOME │ BILLS & DEBTS │ PAYOFF
┌ Balances ───────────────────┐ ┌ Next 60 days ──────────────────────┐
│ Checking    [Balance $1,200]│ │ Dec 1  Salary      +$2,500  $4,025 │
│ Updated 10 days ago         │ │ Dec 1  Home        −$1,800  $2,225 │
│ Savings     [Balance $300]  │ │ Dec 12 Store plan    −$200  $1,340 │ ← low point
│ Updated today               │ │ …                                  │
│ [+ Add account]             │ └────────────────────────────────────┘
└─────────────────────────────┘
```

- **Before a file is open:** an empty-state card with one primary button, "Open runway.json",
  and a short line on what the page does. The header, cards and tabs appear once a file is open.
- **Header:** the title, the file name as a chip, an icon button to open a different file, and
  the save status chip on the right.
- **Summary cards** (MUI `Paper` on a `Grid`, three across on desktop, stacked on phones):
  - Cash now: the total, plus the account count.
  - Lowest, next 60 days: the amount and its date.
  - Runway: "10+ years / No shortfall ahead", or the end date and the payment it stops at.
- **Tabs** (MUI `Tabs`, Check-in selected on open):
  - **Check-in:** Balances on the left (5 of 12 columns) and Next 60 days on the right (7 of 12)
    on desktop; stacked on phones.
  - **Income:** the recurring income and expected inflows editors, each in its own card.
  - **Bills & debts:** the payments editor.
  - **Payoff:** the payoff projection list.

## Check-in tab

- **Balances card.** One row per cash account: the name, the institution in secondary text, and
  an "Updated" line under the name. The amount sits in a labeled currency field.
  - "Updated today", "Updated yesterday" or "Updated N days ago", from the account's `updatedAt`.
    It turns amber after 7 days. With no `updatedAt`, it reads "Not dated", also in amber.
  - **Editing a balance sets that account's `updatedAt` to today's date** (YYYY-MM-DD, local time).
    Nothing else ever changes `updatedAt`.
  - "Add account" adds a row; a delete icon removes one.
- **Next 60 days card.** Every row dated from today through today + 60 days, in a table with
  Date ("Dec 1"), Name, Amount and Balance. Amounts are signed currency, green for money in and
  red for money out; Balance is currency.
  - The lowest balance's row is highlighted and marked "low".
  - The table scrolls inside the card with a sticky header, so the page does not get longer.
  - If the runway ends inside the window, the last row is followed by a line saying so.

## Other tabs

- All editors keep their current behavior and tests, restyled:
  - visible MUI labels instead of placeholders;
  - `$` adornments on amounts, balances and escrow, and `%` on interest rates;
  - Yup errors shown as helper text once a field is touched;
  - fields aligned to a column grid on desktop instead of wrapping;
  - add buttons left-aligned under their list.
- **Payment types** show readable labels, mapped to the stored value: Utility, Insurance,
  Living, Subscription, Credit card, Personal loan, Unsecured loan, Secured loan, Mortgage,
  Collection. A stored value outside the list is shown as is.
- **Payoff** shows each debt with a status chip: "Paid off Jan 20, 2027", "Never at current
  payment", "Beyond 10 years", or "Needs interest rate".
- Money everywhere uses `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
  Dates use a short month and day ("Dec 1"), with the year added when it is not this year.

## Automatic saving

- **Debounce.** A committed change (fields commit when you leave them, as today) starts a
  1-second timer. Another change restarts it. When it fires, the page writes the file.
- **No-op changes never save.** The existing rule stays: a blur that changed nothing is not an
  edit. A session with no edits never writes.
- **Permission.** Opening the file requests read-write permission in the same click. If the
  owner declines, the page still loads, and the chip reads "Saving is off" with an "Allow"
  action that asks again (that click supplies the gesture).
- **Status chip** (`role="status"`, so screen readers hear changes):
  - "Saving…" from the first change until the write finishes;
  - "Saved 7:02 AM" once everything on screen is in the file;
  - "Couldn't save" with "Retry" when a write fails, with nothing on screen lost;
  - "Updated from disk 7:05 AM" after an outside edit was loaded (see below);
  - "Saving is off" with "Allow" when permission is missing.
- **Leaving the page.** While a change is waiting or a write is in progress, the page asks the
  browser to warn before unload. When the tab is hidden, a pending save is written right away.
- **Format.** Unchanged: `JSON.stringify(data, null, 2)` plus a trailing newline.

## Outside edits win

- **Detection.** While the tab is visible, the page reads the file's `lastModified` every 2
  seconds, and immediately when the tab becomes visible or the window gains focus.
- **Own writes.** After each write, the page records the new `lastModified`, so its own saves
  are never mistaken for outside edits.
- **On an outside change:**
  1. The page cancels any pending save.
  2. It reads and parses the file.
  3. It replaces the data on screen; the editors reinitialize from it.
  4. The chip reads "Updated from disk" with the time.

  A change made on the page in the last second is dropped. That is the owner's explicit choice:
  outside edits win.
- **Before every write.** The page checks `lastModified` once more. If the file changed since
  the last read, it skips the write and loads the outside version instead.
- **Unreadable outside version.** If the file was saved half-written or is not valid JSON, the
  page keeps what it shows, stops saving, and the chip reads "Can't read the file's new
  version". It keeps polling and recovers on the next readable version.

## Safety and testing

- **The no-edit guarantee gets stronger.**
  - The round-trip helper visits every tab and tabs through every field, then asserts **no
    write happened at all**.
  - A second round-trip test edits one balance, lets the debounce fire, and asserts the written
    file is deep-equal to the original except for that amount and that account's `updatedAt`.
  - The local-only real-file check keeps working on the same two properties.
- **Automatic saving** is tested with fake timers:
  - the debounce;
  - a restart on a second change;
  - no write for no-op blurs;
  - Retry after a failed write;
  - "Saving is off" when permission is denied.
- **Outside edits** are tested with a stubbed handle whose `lastModified` and contents change:
  - the data reloads;
  - a pending save is cancelled;
  - an own write is not treated as outside;
  - an unreadable version stops saving until a readable one arrives.
- **Check-in rendering:**
  - the "Updated" wording and the amber threshold;
  - the 60-day window bounds;
  - the low-point row;
  - currency and date formatting.
- Fixtures stay made up, and the leak check runs before the PR.

## Left to the builder

- Exact spacing, elevation and responsive breakpoints, within MUI defaults.
- The empty-state wording, beyond the button label.
- Component and helper names, and how the file hook is split.
- How the polling and debounce timers are scheduled internally, as long as the behavior above holds.
