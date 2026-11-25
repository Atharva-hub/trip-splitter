# Trip Splitter

A two-page app to record shared trip expenses and see who owes whom.
React, Redux Toolkit, React Router and strict TypeScript. No backend: data lives in the browser.

## How to run the Project

Needs Node.js 22.12 or newer.

    npm install
    npm run dev          # http://localhost:5173
    npm run typecheck
    npm run lint
    npm test
    npm run build

Not finished: nothing from the brief is missing.

## The paisa rule

All money is an integer number of paise. Everyone's share is rounded down, then the leftover paise go one at a time to the people with the largest cut-off fraction, ties go to whoever is listed first. So ₹100 between 3 is ₹33.34 + ₹33.33 + ₹33.33. Equal and percentage splits use the same function (`src/logic/split.ts`), so balances always add up to exactly ₹0.

## Three decisions

1. Logic is plain TypeScript, outside React. Splitting, balances and validation live in
   `src/logic/` and are tested without React. Components only render and handle
   events. `validateExpenseForm` returns either a typed expense or one message per broken field.
2. Redux holds shared data and saves it. Members and expenses are needed by both pages, so they
   live in Redux; form text, the category filter and the "Expense added" message stay local.
   localStorage is read and written once, in the store setup: one `subscribe` sees every change,
   reducers stay pure, and nothing can forget to save. Saved data is checked at runtime, not
   cast; if invalid, the app starts from the sample data.
3. The form checks every field on Save, and all fields stay required. Errors are calculated from
   the current values instead of being stored, so each one shows next to its field after the first Save and disappears as soon as the field is fixed. Description stays required, as the brief says: without it, two "Food" expenses would look identical in the table and the delete prompt,and a rule that depends on another field would be harder to validate.

## Future Improvements

- A "who pays whom" settle-up list, with UPI payment so balances can be cleared from the app.
- Edit an expense, and add Undo after deleting one.
- Accounts and shared trips, so friends can add expenses from their own phones.

## How I used AI

I used Claude as a development and learning assistant: it generated the initial implementation
and helped me understand TypeScript and Redux Toolkit concepts as I went. I reviewed the code,
customized the UI, and validated the application through type checking, linting, and testing.
