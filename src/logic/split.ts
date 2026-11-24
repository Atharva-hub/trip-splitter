import type { Split } from '../types'
import { percentToHundredths } from './money'

// THE PAISA RULE (used everywhere in the app):
//   Everybody first gets their share rounded DOWN. The paise that are left over
//   are then handed out one at a time to the people whose share had the biggest
//   fractional part. If two people tie, the one listed first gets it.
//
// Example: ₹100.00 (10000 paise) split between 3 people:
//   10000 / 3 = 3333.33..  -> everyone gets 3333, 1 paisa is left over,
//   everyone has the same fraction, so the first person gets it:
//   ₹33.34 + ₹33.33 + ₹33.33 = ₹100.00  -- nothing lost, nothing invented.

interface Weighted {
  id: string
  weight: number // a whole number: "how big is this person's part"
}

// Shares `amount` between people in proportion to their weights.
// Equal split -> every weight is 1.  Percent split -> weights are hundredths of a percent.
function splitByWeight(amount: number, people: Weighted[]): Record<string, number> {
  const totalWeight = people.reduce((sum, person) => sum + person.weight, 0)
  if (totalWeight === 0) {
    return {}
  }

  // Step 1: round everyone's share down and remember what we cut off.
  const parts = people.map((person, position) => {
    const product = amount * person.weight // a whole number, so the maths is exact
    return {
      id: person.id,
      position,
      share: Math.floor(product / totalWeight),
      fractionCutOff: product % totalWeight,
    }
  })

  // Step 2: hand out the leftover paise, biggest cut-off fraction first,
  // earlier position first when it is a tie.
  const alreadyGiven = parts.reduce((sum, part) => sum + part.share, 0)
  const leftover = amount - alreadyGiven
  const luckyOrder = [...parts].sort(
    (a, b) => b.fractionCutOff - a.fractionCutOff || a.position - b.position,
  )
  for (const lucky of luckyOrder.slice(0, leftover)) {
    lucky.share += 1
  }

  const result: Record<string, number> = {}
  for (const part of parts) {
    result[part.id] = part.share
  }
  return result
}

// How much (in paise) each person owes for one expense.
// The numbers always add up to exactly `amount`.
export function computeShares(amount: number, split: Split): Record<string, number> {
  switch (split.type) {
    case 'equal':
      return splitByWeight(
        amount,
        split.memberIds.map((id) => ({ id, weight: 1 })),
      )
    case 'exact':
      return { ...split.shares }
    case 'percent':
      return splitByWeight(
        amount,
        Object.entries(split.shares).map(([id, percent]) => ({
          id,
          weight: percentToHundredths(percent),
        })),
      )
  }
}
