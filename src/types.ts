export interface Member {
  id: string
  name: string
}

export const CATEGORIES = ['Food', 'Travel', 'Stay', 'Activities', 'Other'] as const

export type Category = (typeof CATEGORIES)[number]

export interface EqualSplit {
  type: 'equal'
  memberIds: string[]
}

export interface ExactSplit {
  type: 'exact'
  shares: Record<string, number>
}

export interface PercentSplit {
  type: 'percent'
  shares: Record<string, number>
}

export type Split = EqualSplit | ExactSplit | PercentSplit

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  date: string
  category: Category
  split: Split
}

export type NewExpense = Omit<Expense, 'id'>

export interface TripData {
  members: Member[]
  expenses: Expense[]
}

export type SplitType = Split['type']

export interface ExpenseFormValues {
  description: string
  amount: string
  paidBy: string
  date: string
  category: string
  splitType: SplitType
  equalMemberIds: string[]
  exactShares: Record<string, string>
  percentShares: Record<string, string>
}

export interface FormErrors {
  description?: string
  amount?: string
  paidBy?: string
  date?: string
  category?: string
  split?: string
  shares?: Record<string, string>
}

export type ValidationResult =
  | { ok: true; expense: NewExpense }
  | { ok: false; errors: FormErrors }
