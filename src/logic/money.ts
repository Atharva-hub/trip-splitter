export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; reason: 'empty' | 'invalid' | 'too-many-decimals' }

export function parseScaledNumber(text: string, decimals: number): ParseResult {
  const trimmed = text.trim()
  if (trimmed === '') {
    return { ok: false, reason: 'empty' }
  }

  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(trimmed)
  if (match === null) {
    return { ok: false, reason: 'invalid' }
  }

  const [, sign = '', whole = '0', fraction = ''] = match
  if (fraction.length > decimals) {
    return { ok: false, reason: 'too-many-decimals' }
  }

  const scaledFraction = Number(fraction.padEnd(decimals, '0'))
  const value = Number(whole) * 10 ** decimals + scaledFraction
  return { ok: true, value: sign === '-' ? -value : value }
}

function groupIndian(digits: string): string {
  if (digits.length <= 3) {
    return digits
  }
  const lastThree = digits.slice(-3)
  const rest = digits.slice(0, -3)
  const restWithCommas = rest.replace(/\B(?=(\d{2})+$)/g, ',')
  return `${restWithCommas},${lastThree}`
}

export function formatRupees(paise: number): string {
  const sign = paise < 0 ? '-' : ''
  const absolute = Math.abs(paise)
  const rupees = Math.floor(absolute / 100)
  const remainderPaise = String(absolute % 100).padStart(2, '0')
  return `${sign}₹${groupIndian(String(rupees))}.${remainderPaise}`
}

export function formatPercent(hundredths: number): string {
  const whole = Math.floor(hundredths / 100)
  const fraction = String(hundredths % 100)
    .padStart(2, '0')
    .replace(/0+$/, '')
  return fraction === '' ? String(whole) : `${String(whole)}.${fraction}`
}

export function percentToHundredths(percent: number): number {
  return Math.round(percent * 100)
}
