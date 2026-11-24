// All the shapes of data used in the app live here.
// Money is ALWAYS stored as a whole number of paise (₹1 = 100 paise),
// so we never do maths with decimals like 0.1 + 0.2.

export interface Member {
  id: string
  name: string
}

// `as const` makes this a fixed list, so TypeScript knows the exact strings.
export const CATEGORIES = ['Food', 'Travel', 'Stay', 'Activities', 'Other'] as const

// "Category" becomes: 'Food' | 'Travel' | 'Stay' | 'Activities' | 'Other'
export type Category = (typeof CATEGORIES)[number]

// Three ways to split an expense. They are told apart by the `type` field,
// which is called a "discriminated union". Check `split.type` and TypeScript
// automatically knows which other fields exist.
export interface EqualSplit {
  type: 'equal'
  memberIds: string[]
}

export interface ExactSplit {
  type: 'exact'
  shares: Record<string, number> // memberId -> paise
}

export interface PercentSplit {
  type: 'percent'
  shares: Record<string, number> // memberId -> percent, e.g. 33.33
}

export type Split = EqualSplit | ExactSplit | PercentSplit

export interface Expense {
  id: string
  description: string
  amount: number // paise
  paidBy: string // a member id
  date: string // YYYY-MM-DD
  category: Category
  split: Split
}

// An expense before the app has given it an id.
export type NewExpense = Omit<Expense, 'id'>

export interface TripData {
  members: Member[]
  expenses: Expense[]
}

export type SplitType = Split['type']

// What the form holds. Everything the user types is a string,
// so numbers are only parsed when we validate.
export interface ExpenseFormValues {
  description: string
  amount: string
  paidBy: string // member id, or '' when nothing is chosen
  date: string
  category: string // a Category, or '' when nothing is chosen
  splitType: SplitType
  equalMemberIds: string[]
  exactShares: Record<string, string> // memberId -> text typed in the box
  percentShares: Record<string, string>
}

// One optional error message per field.
export interface FormErrors {
  description?: string
  amount?: string
  paidBy?: string
  date?: string
  category?: string
  split?: string // the message about the whole split (e.g. "₹12.50 left to assign")
  shares?: Record<string, string> // memberId -> message for that member's box
}

export type ValidationResult =
  | { ok: true; expense: NewExpense }
  | { ok: false; errors: FormErrors }
