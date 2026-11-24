// Data that comes from OUTSIDE the app (a JSON file, localStorage) is `unknown`:
// TypeScript cannot know what is inside. These functions check the data at runtime
// and only return it when it is really the right shape. That is how we get typed
// data without using `as` casts.

import { CATEGORIES } from '../types'
import type { Category, Expense, Member, Split, TripData } from '../types'
import { isValidISODate } from './dates'
import { percentToHundredths } from './money'

type UnknownRecord = Record<string, unknown>

// A "type guard": when this returns true, TypeScript treats `value` as an UnknownRecord.
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((category) => category === value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

// Reads { "m1": 100, "m2": 50 } into a Record<string, number>, or returns null.
function parseNumberRecord(value: unknown): Record<string, number> | null {
  if (!isRecord(value)) {
    return null
  }
  const result: Record<string, number> = {}
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== 'number' || !Number.isFinite(item) || item < 0) {
      return null
    }
    result[key] = item
  }
  return result
}

function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0)
}

function parseSplit(value: unknown, amount: number, memberIds: Set<string>): Split | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.type === 'equal') {
    const ids = value.memberIds
    if (!isStringArray(ids) || ids.length === 0) {
      return null
    }
    const allKnownAndUnique = ids.every((id) => memberIds.has(id)) && new Set(ids).size === ids.length
    return allKnownAndUnique ? { type: 'equal', memberIds: ids } : null
  }

  if (value.type === 'exact' || value.type === 'percent') {
    const shares = parseNumberRecord(value.shares)
    if (shares === null || !Object.keys(shares).every((id) => memberIds.has(id))) {
      return null
    }
    const values = Object.values(shares)
    if (value.type === 'exact') {
      // whole paise only, and they must add up to the amount exactly
      const exactOk = values.every(Number.isInteger) && sum(values) === amount
      return exactOk ? { type: 'exact', shares } : null
    }
    // percentages must add up to exactly 100
    const percentOk = sum(values.map(percentToHundredths)) === 10000
    return percentOk ? { type: 'percent', shares } : null
  }

  return null
}

export function parseExpense(value: unknown, memberIds: Set<string>): Expense | null {
  if (!isRecord(value)) {
    return null
  }
  const { id, description, amount, paidBy, date, category } = value

  if (typeof id !== 'string' || id === '') return null
  if (typeof description !== 'string') return null
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) return null
  if (typeof paidBy !== 'string' || !memberIds.has(paidBy)) return null
  if (typeof date !== 'string' || !isValidISODate(date)) return null
  if (!isCategory(category)) return null

  const split = parseSplit(value.split, amount, memberIds)
  if (split === null) return null

  return { id, description, amount, paidBy, date, category, split }
}

export function parseExpenses(value: unknown, members: Member[]): Expense[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const memberIds = new Set(members.map((member) => member.id))
  const expenses: Expense[] = []
  for (const item of value) {
    const expense = parseExpense(item, memberIds)
    if (expense === null) {
      return null // one bad expense means we do not trust the whole list
    }
    expenses.push(expense)
  }
  return expenses
}

function parseMembers(value: unknown): Member[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const members: Member[] = []
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
      return null
    }
    members.push({ id: item.id, name: item.name })
  }
  return members
}

// Checks a whole { members, expenses } object (used for the sample data file).
export function parseTripData(value: unknown): TripData | null {
  if (!isRecord(value)) {
    return null
  }
  const members = parseMembers(value.members)
  if (members === null) {
    return null
  }
  const expenses = parseExpenses(value.expenses, members)
  if (expenses === null) {
    return null
  }
  return { members, expenses }
}
