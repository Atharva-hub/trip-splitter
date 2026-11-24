# Trip Splitter

A two-page app to record shared trip expenses and see who owes whom.
React, Redux Toolkit, React Router and strict TypeScript. No backend: data lives in the browser.

## Run it

Needs Node.js 22.12 or newer.

    npm install
    npm run dev          # http://localhost:5173
    npm run typecheck
    npm run lint
    npm test
    npm run build

Not finished: nothing from the brief is missing. Delete uses `window.confirm` instead of a
custom dialog, and members cannot be edited (they come from the sample data). To reset the data,
delete `trip-splitter:expenses` from localStorage.

## The paisa rule

All money is an integer number of paise. Everyone's share is rounded down, then the leftover paise
go one at a time to the people with the largest cut-off fraction; ties go to whoever is listed
first. So ₹100 between 3 is ₹33.34 + ₹33.33 + ₹33.33. Equal and percentage splits use the same
function (`src/logic/split.ts`), so balances always add up to exactly ₹0.

## Three decisions

1. Logic is plain TypeScript, outside React. Parsing, formatting, splitting, balances and
   validation live in `src/logic/` and are tested without React. Components only render and handle
   events. `validateExpenseForm` returns either a typed expense or one message per broken field.
2. Redux holds shared data; components hold the rest. Redux has members and expenses, which
   both pages need. Form text, the category filter and the "Expense added" message are local.
   Form errors are not stored: they are calculated from the current values after the first Save,
   so they can never be out of date.
3. localStorage is read and written in the store setup, not in reducers or components. One
   `subscribe` sees every change, reducers stay pure, and no component can forget to save.
   Saved data is checked at runtime instead of being cast; if it is missing or invalid, the app
   starts from the sample data.

## With another day

- A custom accessible confirm dialog instead of `window.confirm`.
- A live "left to assign" total while typing exact amounts and percentages.
- A "who pays whom" settle-up list, and cards instead of a table on phones.
- Tests in other time zones and for keyboard-only use of the form.

