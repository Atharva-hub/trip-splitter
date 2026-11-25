# Trip Splitter

Trip Splitter is a shared expense management application that simplifies group expense tracking, cost distribution and balance calculations. It focuses on financial accuracy, transparent calculations and an intuitive user experience.

## Tech Stack

- React
- TypeScript (Strict Mode)
- Redux Toolkit
- React Router
- Vite
- localStorage

## Getting Started

Prerequisite: Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Testing and Production Build

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Features

- Add and delete expenses.
- Equal, exact and percentage-based splitting.
- Automatic member balance calculations.
- Live split preview.
- Participant selection and select-all controls.
- Category filtering and expense totals.
- Persistent browser storage.
- Responsive design and form validation.

## Three Engineering Decisions

### 1. Financial Accuracy and Reusable Logic

JavaScript floating-point arithmetic can introduce rounding discrepancies in financial calculations. To avoid this, all monetary values are represented as integer paise.

I used the largest remainder method to distribute leftover paise after rounding, with ties resolved by participant order. This ensures that individual shares always add up to the original expense and member balances sum to zero.

Equal and percentage splits reuse the same weighted calculation function, reducing code duplication and maintaining consistent rounding behaviour.

### 2. State Management and Persistence

Members and expenses are stored in Redux because they are shared across multiple pages. Balances and totals are calculated from existing expenses rather than stored separately, preventing inconsistent data when expenses are added or deleted.

Form inputs and category filters remain local because they are temporary and component-specific.

I chose a store subscription to centralize localStorage operations instead of duplicating persistence logic across components or introducing side effects inside reducers.

Saved data is validated at runtime because TypeScript cannot guarantee the validity of externally stored JSON. Invalid or missing data falls back to sample data.

### 3. User Experience and Preventive Validation

I redesigned the expense form using an amount-first approach because the expense amount determines subsequent split calculations.

The live split preview allows users to verify individual shares before saving an expense. Select-all controls simplify member selection and reduce unnecessary interactions. A character counter communicates description constraints in advance.

Business logic and validation are separated from UI components to improve maintainability, reusability and independent testing.

## Future Improvements

- UPI integration: Enable users to initiate payments through UPI.
- **Receipt scanning:** Use OCR to extract expense details from receipts and automatically populate editable form fields.
- **Budget management:** Allow users to set spending limits and receive overspending alerts.

## How I Used AI

I used Claude to assist with the initial implementation and understand TypeScript and Redux Toolkit concepts. I reviewed the code, redesigned the expense form to improve usability, and verified the application through type checking, linting and testing.
