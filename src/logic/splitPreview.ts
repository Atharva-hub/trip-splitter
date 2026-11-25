import type { ExpenseFormValues, Member } from '../types'
import { parseScaledNumber } from './money'
import { computeShares } from './split'

// A live preview of what each member would pay, shown while the user is still typing.
// Returns { memberId: paise }. A member who is not part of the split, or any member while
// the split is not complete yet, simply has no entry.
// It is only a preview: validateExpenseForm does the real checking when Save is pressed.

const ALL_PERCENT = 10000 // 100% in hundredths of a percent

function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0)
}

// The expense amount in paise, or null while the box is empty or not a valid positive amount.
function readAmount(text: string): number | null {
  const parsed = parseScaledNumber(text, 2)
  return parsed.ok && parsed.value > 0 ? parsed.value : null
}

// Reads the percentage box of every member, in hundredths of a percent (33.33% -> 3333).
// Blank, invalid, zero or over-100% boxes are skipped.
function readPercentBoxes(members: Member[], boxes: Record<string, string>): Record<string, number> {
  const values: Record<string, number> = {}
  for (const member of members) {
    const parsed = parseScaledNumber(boxes[member.id] ?? '', 2)
    if (parsed.ok && parsed.value > 0 && parsed.value <= ALL_PERCENT) {
      values[member.id] = parsed.value
    }
  }
  return values
}

export function previewShares(values: ExpenseFormValues, members: Member[]): Record<string, number> {
  const amount = readAmount(values.amount)
  if (amount === null) {
    return {}
  }

  if (values.splitType === 'equal') {
    // Keep the members' own order, so the extra paisa goes to the same person as when saving.
    const memberIds = members
      .filter((member) => values.equalMemberIds.includes(member.id))
      .map((member) => member.id)
    return memberIds.length > 0 ? computeShares(amount, { type: 'equal', memberIds }) : {}
  }

  if (values.splitType === 'exact') {
    return {} // the boxes ARE the shares, so there is nothing to preview
  }

  // Percentages: only show rupee shares once they add up to exactly 100%.
  // Before that, a share would be a guess.
  const typed = readPercentBoxes(members, values.percentShares)
  if (sum(Object.values(typed)) !== ALL_PERCENT) {
    return {}
  }
  const percents: Record<string, number> = {}
  for (const [memberId, hundredths] of Object.entries(typed)) {
    percents[memberId] = hundredths / 100
  }
  return computeShares(amount, { type: 'percent', shares: percents })
}
