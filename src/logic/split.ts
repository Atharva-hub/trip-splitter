import type { Split } from '../types'
import { percentToHundredths } from './money'

interface Weighted {
  id: string
  weight: number
}

function splitByWeight(amount: number, people: Weighted[]): Record<string, number> {
  const totalWeight = people.reduce((sum, person) => sum + person.weight, 0)
  if (totalWeight === 0) {
    return {}
  }

  const parts = people.map((person, position) => {
    const product = amount * person.weight
    return {
      id: person.id,
      position,
      share: Math.floor(product / totalWeight),
      fractionCutOff: product % totalWeight,
    }
  })

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
