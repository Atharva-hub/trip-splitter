import type { Category, Expense, Split } from '../types'
import { isCategory } from './parse'

// 'All' means "no filter".
export type CategoryFilter = Category | 'All'

// Newest date first. Expenses on the same date: the one added later comes first.
export function sortNewestFirst(expenses: Expense[]): Expense[] {
  // reverse() makes later-added expenses come first, and sort() keeps that order
  // for equal dates. We copy the array first so we never change the original.
  return [...expenses].reverse().sort((a, b) => b.date.localeCompare(a.date))
}

export function filterByCategory(expenses: Expense[], filter: CategoryFilter): Expense[] {
  if (filter === 'All') {
    return expenses
  }
  return expenses.filter((expense) => expense.category === filter)
}

// Total in paise.
export function totalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}

// "Equally, 4 people", "Exact amounts, 3 people", "By percentage, 3 people"
export function describeSplit(split: Split): string {
  const count = split.type === 'equal' ? split.memberIds.length : Object.keys(split.shares).length
  const people = count === 1 ? '1 person' : `${String(count)} people`
  switch (split.type) {
    case 'equal':
      return `Equally, ${people}`
    case 'exact':
      return `Exact amounts, ${people}`
    case 'percent':
      return `By percentage, ${people}`
  }
}

// The category <select> gives us a plain string. This checks it is one we know,
// so TypeScript can trust it afterwards (no `as` needed).
export function isCategoryFilter(value: string): value is CategoryFilter {
  return value === 'All' || isCategory(value)
}
