import type { ExpenseFormValues, Member } from '../types'

export function makeEmptyFormValues(members: Member[], today: string): ExpenseFormValues {
  return {
    description: '',
    amount: '',
    paidBy: '',
    date: today,
    category: '',
    splitType: 'equal',
    equalMemberIds: members.map((member) => member.id),
    exactShares: {},
    percentShares: {},
  }
}
