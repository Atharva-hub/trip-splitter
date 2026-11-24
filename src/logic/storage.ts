import type { Expense, Member } from '../types'
import { parseExpenses } from './parse'

export const STORAGE_KEY = 'trip-splitter:expenses'

// We only need these two methods, so tests can pass a tiny fake instead of the real localStorage.
type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

// Returns the saved expenses, or null when nothing is saved or the data is unreadable.
// (An empty list [] is valid: it means the user deleted every expense.)
export function loadExpenses(storage: ReadableStorage, members: Member[]): Expense[] | null {
  try {
    const text = storage.getItem(STORAGE_KEY)
    if (text === null) {
      return null
    }
    const data: unknown = JSON.parse(text)
    return parseExpenses(data, members)
  } catch {
    // JSON.parse throws on broken text; storage can throw when it is blocked.
    return null
  }
}

export function saveExpenses(storage: WritableStorage, expenses: Expense[]): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  } catch {
    // Storage can be full or disabled (private mode). The app still works, it just won't remember.
  }
}
