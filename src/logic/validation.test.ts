import { describe, expect, it } from 'vitest'
import type { ExpenseFormValues, FormErrors, Member } from '../types'
import { makeEmptyFormValues } from './formValues'
import { validateExpenseForm } from './validation'

const members: Member[] = [
  { id: 'm1', name: 'Aarav' },
  { id: 'm2', name: 'Diya' },
  { id: 'm3', name: 'Kabir' },
]
const TODAY = '2026-06-15'

function validValues(changes: Partial<ExpenseFormValues> = {}): ExpenseFormValues {
  return {
    ...makeEmptyFormValues(members, TODAY),
    description: 'Dinner',
    amount: '300',
    paidBy: 'm1',
    category: 'Food',
    ...changes,
  }
}

function errorsFor(changes: Partial<ExpenseFormValues>): FormErrors {
  const result = validateExpenseForm(validValues(changes), members, TODAY)
  if (result.ok) {
    throw new Error('expected the form to be invalid')
  }
  return result.errors
}

describe('validateExpenseForm: valid input', () => {
  it('returns a clean expense in paise', () => {
    const result = validateExpenseForm(validValues({ amount: '1250.50' }), members, TODAY)
    expect(result).toEqual({
      ok: true,
      expense: {
        description: 'Dinner',
        amount: 125050,
        paidBy: 'm1',
        date: TODAY,
        category: 'Food',
        split: { type: 'equal', memberIds: ['m1', 'm2', 'm3'] },
      },
    })
  })

  it('trims the description', () => {
    const result = validateExpenseForm(validValues({ description: '  Taxi  ' }), members, TODAY)
    expect(result.ok && result.expense.description).toBe('Taxi')
  })

  it('accepts the limits: 60 characters and ₹10,00,000', () => {
    const result = validateExpenseForm(
      validValues({ description: 'x'.repeat(60), amount: '1000000' }),
      members,
      TODAY,
    )
    expect(result.ok).toBe(true)
  })

  it("accepts today's date", () => {
    expect(validateExpenseForm(validValues({ date: TODAY }), members, TODAY).ok).toBe(true)
  })
})

describe('validateExpenseForm: description', () => {
  it('is required', () => {
    expect(errorsFor({ description: '   ' }).description).toBe('Description is required')
  })

  it('is at most 60 characters', () => {
    expect(errorsFor({ description: 'x'.repeat(61) }).description).toMatch(/at most 60/)
  })
})

describe('validateExpenseForm: amount', () => {
  it('is required', () => {
    expect(errorsFor({ amount: '' }).amount).toBe('Amount is required')
  })

  it('shows the exact message for a negative amount', () => {
    expect(errorsFor({ amount: '-50' }).amount).toBe('Amount must be more than ₹0')
  })

  it('must be more than zero', () => {
    expect(errorsFor({ amount: '0' }).amount).toBe('Amount must be more than ₹0')
    expect(errorsFor({ amount: '0.00' }).amount).toBe('Amount must be more than ₹0')
  })

  it('has at most 2 decimals', () => {
    expect(errorsFor({ amount: '10.505' }).amount).toMatch(/2 decimal/)
  })

  it('is at most ₹10,00,000', () => {
    expect(errorsFor({ amount: '1000000.01' }).amount).toMatch(/₹10,00,000.00/)
  })

  it('must be a number', () => {
    expect(errorsFor({ amount: 'abc' }).amount).toMatch(/valid amount/)
  })
})

describe('validateExpenseForm: paid by, date, category', () => {
  it('are required', () => {
    const errors = errorsFor({ paidBy: '', date: '', category: '' })
    expect(errors.paidBy).toBeDefined()
    expect(errors.date).toBe('Date is required')
    expect(errors.category).toBeDefined()
  })

  it('does not allow a date in the future', () => {
    expect(errorsFor({ date: '2026-06-16' }).date).toBe('Date cannot be in the future')
  })

  it('does not allow an impossible date', () => {
    expect(errorsFor({ date: '2026-02-31' }).date).toBe('Enter a valid date')
  })

  it('does not allow an unknown member or category', () => {
    expect(errorsFor({ paidBy: 'zzz' }).paidBy).toBeDefined()
    expect(errorsFor({ category: 'Shopping' }).category).toBeDefined()
  })
})

describe('validateExpenseForm: equal split', () => {
  it('needs at least one member', () => {
    expect(errorsFor({ equalMemberIds: [] }).split).toBe('Select at least one member')
  })

  it('keeps members in the list order, whatever order they were ticked', () => {
    const result = validateExpenseForm(
      validValues({ equalMemberIds: ['m3', 'm1'] }),
      members,
      TODAY,
    )
    expect(result.ok && result.expense.split).toEqual({ type: 'equal', memberIds: ['m1', 'm3'] })
  })
})

describe('validateExpenseForm: exact split', () => {
  const exact = (shares: Record<string, string>, amount = '300') => ({
    splitType: 'exact' as const,
    amount,
    exactShares: shares,
  })

  it('saves when the amounts add up exactly', () => {
    const result = validateExpenseForm(
      validValues(exact({ m1: '100', m2: '200.00' })),
      members,
      TODAY,
    )
    expect(result.ok && result.expense.split).toEqual({
      type: 'exact',
      shares: { m1: 10000, m2: 20000 },
    })
  })

  it('says how much is left to assign', () => {
    expect(errorsFor(exact({ m1: '100', m2: '187.50' })).split).toBe('₹12.50 left to assign')
  })

  it('says how much is over', () => {
    expect(errorsFor(exact({ m1: '200', m2: '112.50' })).split).toBe('₹12.50 over the amount')
  })

  it('shows an error next to a negative or invalid box', () => {
    const errors = errorsFor(exact({ m1: '-5', m2: 'abc', m3: '1.234' }))
    expect(errors.shares).toEqual({
      m1: 'Must be ₹0 or more',
      m2: 'Enter a number',
      m3: 'Use at most 2 decimal places',
    })
  })

  it('treats blank boxes as ₹0', () => {
    expect(errorsFor(exact({})).split).toBe('₹300.00 left to assign')
  })
})

describe('validateExpenseForm: percent split', () => {
  const percent = (shares: Record<string, string>) => ({
    splitType: 'percent' as const,
    percentShares: shares,
  })

  it('saves when the percentages add up to exactly 100', () => {
    const result = validateExpenseForm(
      validValues(percent({ m1: '33.33', m2: '33.33', m3: '33.34' })),
      members,
      TODAY,
    )
    expect(result.ok && result.expense.split).toEqual({
      type: 'percent',
      shares: { m1: 33.33, m2: 33.33, m3: 33.34 },
    })
  })

  it('says how much is left', () => {
    expect(errorsFor(percent({ m1: '60', m2: '30.5' })).split).toBe('9.5% left to assign')
  })

  it('says how much is over', () => {
    expect(errorsFor(percent({ m1: '60', m2: '50' })).split).toBe('10% over 100%')
  })

  it('needs each value between 0 and 100 with at most 2 decimals', () => {
    const errors = errorsFor(percent({ m1: '101', m2: '-1', m3: '1.005' }))
    expect(errors.shares).toEqual({
      m1: 'Must be between 0 and 100',
      m2: 'Must be between 0 and 100',
      m3: 'Use at most 2 decimal places',
    })
  })
})

describe('validateExpenseForm: several errors at once', () => {
  it('reports every broken field, not just the first', () => {
    const result = validateExpenseForm(makeEmptyFormValues(members, TODAY), members, TODAY)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['amount', 'category', 'description', 'paidBy'])
    }
  })
})
