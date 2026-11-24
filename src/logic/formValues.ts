import type { ExpenseFormValues, Member } from '../types'

// What the Add expense form looks like when it first opens.
export function makeEmptyFormValues(members: Member[], today: string): ExpenseFormValues {
  return {
    description: '',
    amount: '',
    paidBy: '',
    date: today,
    category: '',
    splitType: 'equal',
    equalMemberIds: members.map((member) => member.id), // everyone ticked to start
    exactShares: {},
    percentShares: {},
  }
}
