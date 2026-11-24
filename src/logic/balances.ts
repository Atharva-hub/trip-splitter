import type { Expense, Member } from '../types'
import { formatRupees } from './money'
import { computeShares } from './split'

// balance = what a person paid  -  their share of every expense they are part of.
// Positive: they get money back. Negative: they owe money.
// Returns { memberId: paise }.
export function calculateBalances(members: Member[], expenses: Expense[]): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const member of members) {
    balances[member.id] = 0
  }

  for (const expense of expenses) {
    // The payer is credited the full amount (they may not be in the split at all).
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount

    // Everybody in the split is charged their share.
    const shares = computeShares(expense.amount, expense.split)
    for (const [memberId, share] of Object.entries(shares)) {
      balances[memberId] = (balances[memberId] ?? 0) - share
    }
  }

  return balances
}

// Words shown next to a member's name.
export function describeBalance(paise: number): string {
  if (paise > 0) {
    return `gets back ${formatRupees(paise)}`
  }
  if (paise < 0) {
    return `owes ${formatRupees(-paise)}`
  }
  return 'settled up'
}
