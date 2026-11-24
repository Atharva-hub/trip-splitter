// Date helpers. Dates are plain "YYYY-MM-DD" strings, so we can compare them
// as text ("2026-03-12" < "2026-03-13") and never worry about time zones.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Today's date in the USER'S time zone as YYYY-MM-DD.
// (Date.toISOString() uses UTC, which gives "yesterday" for India
// between midnight and 5:30 am. So we read the local parts instead.)
export function todayISO(now: Date = new Date()): string {
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// True for real calendar dates like "2026-03-12", false for "2026-02-31" or "hello".
export function isValidISODate(text: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (match === null) {
    return false
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  // Build the date and check that JavaScript did not "roll it over" to another day.
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

// "2026-03-12" -> "12 Mar 2026"
export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  const monthName = MONTHS[Number(month) - 1]
  if (year === undefined || day === undefined || monthName === undefined) {
    return isoDate
  }
  return `${String(Number(day))} ${monthName} ${year}`
}
