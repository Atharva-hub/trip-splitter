import { describe, expect, it } from 'vitest'
import { sampleData } from '../store/tripSlice'
import { STORAGE_KEY, loadExpenses, saveExpenses } from './storage'

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value
    },
  }
}

const { members, expenses } = sampleData

describe('loadExpenses', () => {
  it('returns null when nothing is saved', () => {
    expect(loadExpenses(fakeStorage(), members)).toBeNull()
  })

  it('reads back what was saved', () => {
    const storage = fakeStorage()
    saveExpenses(storage, expenses)
    expect(loadExpenses(storage, members)).toEqual(expenses)
  })

  it('treats an empty list as valid (the user deleted everything)', () => {
    const storage = fakeStorage()
    saveExpenses(storage, [])
    expect(loadExpenses(storage, members)).toEqual([])
  })

  it('returns null for text that is not JSON', () => {
    expect(loadExpenses(fakeStorage({ [STORAGE_KEY]: '{oops' }), members)).toBeNull()
  })

  it('returns null when the data has the wrong shape', () => {
    expect(loadExpenses(fakeStorage({ [STORAGE_KEY]: '{"a":1}' }), members)).toBeNull()
    expect(loadExpenses(fakeStorage({ [STORAGE_KEY]: '[{"id":"e1"}]' }), members)).toBeNull()
  })

  it('returns null when an expense does not add up', () => {
    const broken = [
      { ...expenses[0], split: { type: 'exact', shares: { m1: 1 } } },
    ]
    expect(loadExpenses(fakeStorage({ [STORAGE_KEY]: JSON.stringify(broken) }), members)).toBeNull()
  })

  it('returns null when an expense mentions an unknown member', () => {
    const broken = [{ ...expenses[0], paidBy: 'ghost' }]
    expect(loadExpenses(fakeStorage({ [STORAGE_KEY]: JSON.stringify(broken) }), members)).toBeNull()
  })

  it('returns null when reading storage throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadExpenses(throwing, members)).toBeNull()
  })
})

describe('saveExpenses', () => {
  it('does not crash when storage is full', () => {
    const full = {
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }
    expect(() => {
      saveExpenses(full, expenses)
    }).not.toThrow()
  })
})
