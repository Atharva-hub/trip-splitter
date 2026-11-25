import type { Expense, Member } from '../types'
import { parseExpenses } from './parse'

export const STORAGE_KEY = 'trip-splitter:expenses'

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

export function loadExpenses(storage: ReadableStorage, members: Member[]): Expense[] | null {
  try {
    const text = storage.getItem(STORAGE_KEY)
    if (text === null) {
      return null
    }
    const data: unknown = JSON.parse(text)
    return parseExpenses(data, members)
  } catch {
    return null
  }
}

export function saveExpenses(storage: WritableStorage, expenses: Expense[]): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  } catch {
    return
  }
}
