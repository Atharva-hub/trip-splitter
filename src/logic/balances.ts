import type { Expense, Member } from '../types'
import { formatRupees } from './money'
import { computeShares } from './split'

export function calculateBalances(members: Member[], expenses: Expense[]): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const member of members) {
    balances[member.id] = 0
  }

  for (const expense of expenses) {
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount

    const shares = computeShares(expense.amount, expense.split)
    for (const [memberId, share] of Object.entries(shares)) {
      balances[memberId] = (balances[memberId] ?? 0) - share
    }
  }

  return balances
}

export function describeBalance(paise: number): string {
  if (paise > 0) {
    return `gets back ${formatRupees(paise)}`
  }
  if (paise < 0) {
    return `owes ${formatRupees(-paise)}`
  }
  return 'settled up'
}
