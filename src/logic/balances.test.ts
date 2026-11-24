import { describe, expect, it } from 'vitest'
import { sampleData } from '../store/tripSlice'
import type { Expense, Member } from '../types'
import { calculateBalances, describeBalance } from './balances'

const members: Member[] = [
  { id: 'a', name: 'Asha' },
  { id: 'b', name: 'Bala' },
  { id: 'c', name: 'Chitra' },
]

function expense(partial: Partial<Expense> & Pick<Expense, 'amount' | 'paidBy' | 'split'>): Expense {
  return { id: 'x', description: 'Test', date: '2026-01-01', category: 'Other', ...partial }
}

const sumOf = (balances: Record<string, number>) =>
  Object.values(balances).reduce((a, b) => a + b, 0)

describe('calculateBalances', () => {
  it('is all zero with no expenses', () => {
    expect(calculateBalances(members, [])).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('gives the payer back what the others owe', () => {
    const balances = calculateBalances(members, [
      expense({ amount: 30000, paidBy: 'a', split: { type: 'equal', memberIds: ['a', 'b', 'c'] } }),
    ])
    expect(balances).toEqual({ a: 20000, b: -10000, c: -10000 })
  })

  it('lets the payer stay out of the split (groceries for the others)', () => {
    const balances = calculateBalances(members, [
      expense({ amount: 10000, paidBy: 'a', split: { type: 'equal', memberIds: ['b', 'c'] } }),
    ])
    expect(balances).toEqual({ a: 10000, b: -5000, c: -5000 })
  })

  it('handles ₹100 split equally between 3 and still adds up to zero', () => {
    const balances = calculateBalances(members, [
      expense({ amount: 10000, paidBy: 'a', split: { type: 'equal', memberIds: ['a', 'b', 'c'] } }),
    ])
    // Asha paid 10000 and owes 3334 herself
    expect(balances).toEqual({ a: 6666, b: -3333, c: -3333 })
    expect(sumOf(balances)).toBe(0)
  })

  it('combines several expenses', () => {
    const balances = calculateBalances(members, [
      expense({ amount: 6000, paidBy: 'a', split: { type: 'exact', shares: { b: 6000 } } }),
      expense({ amount: 6000, paidBy: 'b', split: { type: 'exact', shares: { a: 6000 } } }),
    ])
    expect(balances).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('adds up to exactly zero for the sample data', () => {
    const balances = calculateBalances(sampleData.members, sampleData.expenses)
    expect(sumOf(balances)).toBe(0)
  })

  it('gives the right balances for the sample data', () => {
    // Worked out by hand (all in paise). Example, Aarav (m1):
    //   paid   2,400,000 (villa) + 149,999 (cab)                      = 2,549,999
    //   owes   480,000 (villa) + 81,250 (dinner) + 50,000 (scooter)
    //        + 33,334 (groceries, he gets the extra paisa) + 49,995 (cab) = 694,579
    //   balance = 2,549,999 - 694,579 = 1,855,420
    expect(calculateBalances(sampleData.members, sampleData.expenses)).toEqual({
      m1: 1855420,
      m2: -369578,
      m3: 55408,
      m4: -811250,
      m5: -730000,
    })
  })
})

describe('describeBalance', () => {
  it('describes each case in words', () => {
    expect(describeBalance(125050)).toBe('gets back ₹1,250.50')
    expect(describeBalance(-5000)).toBe('owes ₹50.00')
    expect(describeBalance(0)).toBe('settled up')
  })
})
