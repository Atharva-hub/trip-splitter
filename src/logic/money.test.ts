import { describe, expect, it } from 'vitest'
import { formatPercent, formatRupees, parseScaledNumber } from './money'

describe('parseScaledNumber', () => {
  it('turns rupees into paise exactly', () => {
    expect(parseScaledNumber('1250.50', 2)).toEqual({ ok: true, value: 125050 })
    expect(parseScaledNumber('12.5', 2)).toEqual({ ok: true, value: 1250 })
    expect(parseScaledNumber('7', 2)).toEqual({ ok: true, value: 700 })
    expect(parseScaledNumber('0.07', 2)).toEqual({ ok: true, value: 7 })
  })

  it('has no floating point surprises', () => {
    expect(parseScaledNumber('19.99', 2)).toEqual({ ok: true, value: 1999 })
    expect(parseScaledNumber('1.15', 2)).toEqual({ ok: true, value: 115 })
  })

  it('understands negative numbers', () => {
    expect(parseScaledNumber('-5', 2)).toEqual({ ok: true, value: -500 })
  })

  it('rejects bad input', () => {
    expect(parseScaledNumber('', 2)).toEqual({ ok: false, reason: 'empty' })
    expect(parseScaledNumber('   ', 2)).toEqual({ ok: false, reason: 'empty' })
    expect(parseScaledNumber('abc', 2)).toEqual({ ok: false, reason: 'invalid' })
    expect(parseScaledNumber('1,000', 2)).toEqual({ ok: false, reason: 'invalid' })
    expect(parseScaledNumber('1.2.3', 2)).toEqual({ ok: false, reason: 'invalid' })
    expect(parseScaledNumber('10.123', 2)).toEqual({ ok: false, reason: 'too-many-decimals' })
  })
})

describe('formatRupees', () => {
  it('uses Indian digit grouping', () => {
    expect(formatRupees(10000000)).toBe('₹1,00,000.00')
    expect(formatRupees(123456789)).toBe('₹12,34,567.89')
    expect(formatRupees(125050)).toBe('₹1,250.50')
    expect(formatRupees(2400000)).toBe('₹24,000.00')
    expect(formatRupees(100000000)).toBe('₹10,00,000.00')
  })

  it('handles small and zero amounts', () => {
    expect(formatRupees(0)).toBe('₹0.00')
    expect(formatRupees(5)).toBe('₹0.05')
    expect(formatRupees(99999)).toBe('₹999.99')
  })

  it('handles negative amounts', () => {
    expect(formatRupees(-125050)).toBe('-₹1,250.50')
  })
})

describe('formatPercent', () => {
  it('drops pointless zeros', () => {
    expect(formatPercent(3333)).toBe('33.33')
    expect(formatPercent(5000)).toBe('50')
    expect(formatPercent(1250)).toBe('12.5')
    expect(formatPercent(10000)).toBe('100')
  })
})
