import { describe, expect, it } from 'vitest'
import { sampleData } from '../store/tripSlice'
import { describeSplit, filterByCategory, sortNewestFirst, totalAmount } from './expenses'
import { formatDisplayDate, isValidISODate, todayISO } from './dates'

const { expenses } = sampleData

describe('sortNewestFirst', () => {
  it('puts the newest date first, and later-added first on the same date', () => {
    expect(sortNewestFirst(expenses).map((e) => e.id)).toEqual(['e6', 'e5', 'e4', 'e3', 'e2', 'e1'])
  })

  it('does not change the original list', () => {
    const before = expenses.map((e) => e.id)
    sortNewestFirst(expenses)
    expect(expenses.map((e) => e.id)).toEqual(before)
  })
})

describe('filterByCategory and totalAmount', () => {
  it('keeps everything for "All"', () => {
    expect(filterByCategory(expenses, 'All')).toHaveLength(6)
  })

  it('filters by category and totals what is shown', () => {
    const food = filterByCategory(expenses, 'Food')
    expect(food.map((e) => e.id)).toEqual(['e2', 'e5'])
    expect(totalAmount(food)).toBe(425000)
  })

  it('gives an empty list and a zero total for a category with no expenses', () => {
    const other = filterByCategory(expenses, 'Other')
    expect(other).toEqual([])
    expect(totalAmount(other)).toBe(0)
  })
})

describe('describeSplit', () => {
  it('describes each kind of split', () => {
    expect(describeSplit({ type: 'equal', memberIds: ['a', 'b', 'c', 'd'] })).toBe('Equally, 4 people')
    expect(describeSplit({ type: 'equal', memberIds: ['a'] })).toBe('Equally, 1 person')
    expect(describeSplit({ type: 'exact', shares: { a: 1, b: 2, c: 3 } })).toBe('Exact amounts, 3 people')
    expect(describeSplit({ type: 'percent', shares: { a: 50, b: 50 } })).toBe('By percentage, 2 people')
  })
})

describe('dates', () => {
  it('formats dates for display', () => {
    expect(formatDisplayDate('2026-03-05')).toBe('5 Mar 2026')
  })

  it('knows real dates from fake ones', () => {
    expect(isValidISODate('2026-02-28')).toBe(true)
    expect(isValidISODate('2024-02-29')).toBe(true) // leap year
    expect(isValidISODate('2026-02-29')).toBe(false)
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('12/03/2026')).toBe(false)
  })

  it('uses the local date, not UTC', () => {
    // 1 am on 5 March in the computer's own time zone
    expect(todayISO(new Date(2026, 2, 5, 1, 0))).toBe('2026-03-05')
  })
})
