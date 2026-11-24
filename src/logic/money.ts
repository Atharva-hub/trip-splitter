// Money helpers. Plain functions, no React.
// 1 rupee = 100 paise. We keep every amount as an integer number of paise.

export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; reason: 'empty' | 'invalid' | 'too-many-decimals' }

// Turns text like "12.5" into a whole number scaled by 10^decimals,
// WITHOUT using floating point maths.
//   parseScaledNumber("12.5", 2)  -> { ok: true, value: 1250 }   (paise)
//   parseScaledNumber("33.33", 2) -> { ok: true, value: 3333 }   (hundredths of a percent)
export function parseScaledNumber(text: string, decimals: number): ParseResult {
  const trimmed = text.trim()
  if (trimmed === '') {
    return { ok: false, reason: 'empty' }
  }

  // optional "-", digits, optionally a "." followed by digits
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(trimmed)
  if (match === null) {
    return { ok: false, reason: 'invalid' }
  }

  const [, sign = '', whole = '0', fraction = ''] = match
  if (fraction.length > decimals) {
    return { ok: false, reason: 'too-many-decimals' }
  }

  // "5" with 2 decimals -> "50" -> 50 paise
  const scaledFraction = Number(fraction.padEnd(decimals, '0'))
  const value = Number(whole) * 10 ** decimals + scaledFraction
  return { ok: true, value: sign === '-' ? -value : value }
}

// Adds Indian-style commas: 100000 -> "1,00,000", 1234567 -> "12,34,567".
// The last 3 digits form one group, every group before that has 2 digits.
function groupIndian(digits: string): string {
  if (digits.length <= 3) {
    return digits
  }
  const lastThree = digits.slice(-3)
  const rest = digits.slice(0, -3)
  // put a comma before every pair of digits that is followed only by pairs
  const restWithCommas = rest.replace(/\B(?=(\d{2})+$)/g, ',')
  return `${restWithCommas},${lastThree}`
}

// 10000000 paise -> "₹1,00,000.00"
export function formatRupees(paise: number): string {
  const sign = paise < 0 ? '-' : ''
  const absolute = Math.abs(paise)
  const rupees = Math.floor(absolute / 100)
  const remainderPaise = String(absolute % 100).padStart(2, '0')
  return `${sign}₹${groupIndian(String(rupees))}.${remainderPaise}`
}

// Percentages are kept in hundredths of a percent: 3333 -> "33.33", 5000 -> "50".
export function formatPercent(hundredths: number): string {
  const whole = Math.floor(hundredths / 100)
  const fraction = String(hundredths % 100)
    .padStart(2, '0')
    .replace(/0+$/, '') // 12.50 -> 12.5, 50.00 -> 50
  return fraction === '' ? String(whole) : `${String(whole)}.${fraction}`
}

// The sample data stores percent as a normal number (33.33).
// Convert to hundredths (3333) so we can add them exactly.
export function percentToHundredths(percent: number): number {
  return Math.round(percent * 100)
}
