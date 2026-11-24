import { describeSplit } from '../logic/expenses'
import { formatDisplayDate } from '../logic/dates'
import { getMemberName } from '../logic/members'
import { formatRupees } from '../logic/money'
import type { Expense, Member } from '../types'

interface Props {
  expenses: Expense[] // already filtered and sorted by the page
  members: Member[]
  onDelete: (expense: Expense) => void
}

export default function ExpenseTable({ expenses, members, onDelete }: Props) {
  return (
    // On small screens the table scrolls sideways. tabIndex lets keyboard users scroll it.
    <div className="table-scroll" role="region" aria-label="Expenses table" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col">Paid by</th>
            <th scope="col" className="number">
              Amount
            </th>
            <th scope="col">Split</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{formatDisplayDate(expense.date)}</td>
              <td>{expense.description}</td>
              <td>{expense.category}</td>
              <td>{getMemberName(members, expense.paidBy)}</td>
              <td className="number">{formatRupees(expense.amount)}</td>
              <td>{describeSplit(expense.split)}</td>
              <td>
                <button
                  type="button"
                  className="button danger small"
                  onClick={() => {
                    onDelete(expense)
                  }}
                  aria-label={`Delete ${expense.description}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
