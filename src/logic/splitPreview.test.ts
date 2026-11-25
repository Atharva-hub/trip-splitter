import { describe, expect, it } from 'vitest'
import type { ExpenseFormValues, Member } from '../types'
import { makeEmptyFormValues } from './formValues'
import { previewShares } from './splitPreview'

const members: Member[] = [
  { id: 'm1', name: 'Aarav' },
  { id: 'm2', name: 'Diya' },
  { id: 'm3', name: 'Kabir' },
]

function values(changes: Partial<ExpenseFormValues>): ExpenseFormValues {
  return { ...makeEmptyFormValues(members, '2026-06-15'), ...changes }
}

describe('previewShares: equal', () => {
  it('shows each share, with the extra paisa going to the first member', () => {
    expect(previewShares(values({ amount: '100' }), members)).toEqual({
      m1: 3334,
      m2: 3333,
      m3: 3333,
    })
  })

  it('gives members who are not ticked no share', () => {
    const shares = previewShares(values({ amount: '100', equalMemberIds: ['m1', 'm3'] }), members)
    expect(shares).toEqual({ m1: 5000, m3: 5000 })
  })

  it('has no shares when nobody is ticked', () => {
    expect(previewShares(values({ amount: '100', equalMemberIds: [] }), members)).toEqual({})
  })

  it('has no shares while the amount is empty or invalid', () => {
    expect(previewShares(values({ amount: '' }), members)).toEqual({})
    expect(previewShares(values({ amount: 'abc' }), members)).toEqual({})
    expect(previewShares(values({ amount: '-5' }), members)).toEqual({})
  })
})

describe('previewShares: exact amounts', () => {
  it('has nothing to preview, because the boxes are the shares', () => {
    const exact = values({ splitType: 'exact', amount: '300', exactShares: { m1: '100', m2: '200' } })
    expect(previewShares(exact, members)).toEqual({})
  })
})

describe('previewShares: percentages', () => {
  const percent = (shares: Record<string, string>, amount = '1000') =>
    values({ splitType: 'percent', amount, percentShares: shares })

  it('shows rupee shares once the percentages add up to 100', () => {
    expect(previewShares(percent({ m1: '60', m2: '40' }), members)).toEqual({
      m1: 60000,
      m2: 40000,
    })
  })

  it('uses the same paisa rule as saving (33.33 / 33.33 / 33.34 of ₹1,499.99)', () => {
    const shares = previewShares(
      percent({ m1: '33.33', m2: '33.33', m3: '33.34' }, '1499.99'),
      members,
    )
    expect(shares).toEqual({ m1: 49995, m2: 49995, m3: 50009 })
  })

  it('shows no shares until the percentages add up to 100', () => {
    expect(previewShares(percent({ m1: '60' }), members)).toEqual({})
  })

  it('shows no shares when the percentages are over 100', () => {
    expect(previewShares(percent({ m1: '60', m2: '50' }), members)).toEqual({})
  })

  it('ignores a single box over 100%', () => {
    expect(previewShares(percent({ m1: '150' }), members)).toEqual({})
  })

  it('shows no shares while the amount is not valid', () => {
    expect(previewShares(percent({ m1: '60', m2: '40' }, ''), members)).toEqual({})
  })
})
