import type { Category, Expense, Split } from '../types'
import { isCategory } from './parse'

export type CategoryFilter = Category | 'All'

export function sortNewestFirst(expenses: Expense[]): Expense[] {
  return [...expenses].reverse().sort((a, b) => b.date.localeCompare(a.date))
}

export function filterByCategory(expenses: Expense[], filter: CategoryFilter): Expense[] {
  if (filter === 'All') {
    return expenses
  }
  return expenses.filter((expense) => expense.category === filter)
}

export function totalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}

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

export function isCategoryFilter(value: string): value is CategoryFilter {
  return value === 'All' || isCategory(value)
}
