import { describe, expect, it } from 'vitest'
import type { Split } from '../types'
import { computeShares } from './split'

const total = (shares: Record<string, number>) => Object.values(shares).reduce((a, b) => a + b, 0)

describe('computeShares: equal', () => {
  it('splits ₹100 between 3 as ₹33.34 + ₹33.33 + ₹33.33', () => {
    const shares = computeShares(10000, { type: 'equal', memberIds: ['a', 'b', 'c'] })
    expect(shares).toEqual({ a: 3334, b: 3333, c: 3333 })
    expect(total(shares)).toBe(10000)
  })

  it('gives the extra paise to the first people in the list', () => {
    // 10 paise between 4 people: 2 extra paise -> first two people
    const shares = computeShares(10, { type: 'equal', memberIds: ['a', 'b', 'c', 'd'] })
    expect(shares).toEqual({ a: 3, b: 3, c: 2, d: 2 })
  })

  it('splits evenly when it divides exactly', () => {
    expect(computeShares(10000, { type: 'equal', memberIds: ['a', 'b'] })).toEqual({
      a: 5000,
      b: 5000,
    })
  })

  it('works for one person', () => {
    expect(computeShares(12345, { type: 'equal', memberIds: ['a'] })).toEqual({ a: 12345 })
  })

  it('never loses or invents a paisa, for many amounts and group sizes', () => {
    for (let amount = 1; amount <= 500; amount++) {
      for (let people = 1; people <= 7; people++) {
        const memberIds = Array.from({ length: people }, (_, i) => `m${String(i)}`)
        const shares = computeShares(amount, { type: 'equal', memberIds })
        expect(total(shares)).toBe(amount)
      }
    }
  })
})

describe('computeShares: exact', () => {
  it('uses the amounts as they are', () => {
    const split: Split = { type: 'exact', shares: { a: 7000, b: 3000 } }
    expect(computeShares(10000, split)).toEqual({ a: 7000, b: 3000 })
  })
})

describe('computeShares: percent', () => {
  it('splits by percentage', () => {
    const shares = computeShares(200000, { type: 'percent', shares: { m5: 50, m1: 25, m2: 25 } })
    expect(shares).toEqual({ m5: 100000, m1: 50000, m2: 50000 })
  })

  it('handles the airport cab (33.33 / 33.33 / 33.34) without losing a paisa', () => {
    const shares = computeShares(149999, {
      type: 'percent',
      shares: { m1: 33.33, m2: 33.33, m3: 33.34 },
    })
    expect(total(shares)).toBe(149999)
    expect(shares).toEqual({ m1: 49995, m2: 49995, m3: 50009 })
  })

  it('gives leftover paise to the biggest fraction, not to a 0% person', () => {
    // ₹0.01 (1 paisa) at 0% / 33.33% / 66.67%  -> the paisa goes to the 66.67% person
    const shares = computeShares(1, { type: 'percent', shares: { a: 0, b: 33.33, c: 66.67 } })
    expect(shares).toEqual({ a: 0, b: 0, c: 1 })
  })

  it('always adds up to the amount', () => {
    for (let amount = 1; amount <= 300; amount++) {
      const shares = computeShares(amount, {
        type: 'percent',
        shares: { a: 33.33, b: 33.33, c: 33.34 },
      })
      expect(total(shares)).toBe(amount)
    }
  })
})
