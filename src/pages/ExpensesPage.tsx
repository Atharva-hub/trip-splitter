import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BalanceList from '../components/BalanceList'
import ExpenseTable from '../components/ExpenseTable'
import {
  filterByCategory,
  isCategoryFilter,
  sortNewestFirst,
  totalAmount,
} from '../logic/expenses'
import type { CategoryFilter } from '../logic/expenses'
import { formatRupees } from '../logic/money'
import { expenseDeleted, selectExpenses, selectMembers } from '../store/tripSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { CATEGORIES } from '../types'
import type { Expense } from '../types'

// The Add expense page sends a message through the router: navigate('/', { state: { flash } }).
// Router state is `unknown`, so we check it before using it.
function readFlashMessage(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'flash' in state) {
    return typeof state.flash === 'string' ? state.flash : null
  }
  return null
}

export default function ExpensesPage() {
  const dispatch = useAppDispatch()
  const members = useAppSelector(selectMembers)
  const expenses = useAppSelector(selectExpenses)

  // Only this page cares about the filter, so it is component state, not Redux.
  const [filter, setFilter] = useState<CategoryFilter>('All')

  const location = useLocation()
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(() => readFlashMessage(location.state))

  // Once the message is copied into state, clear it from the history entry,
  // otherwise it would show up again after a page reload.
  useEffect(() => {
    if (readFlashMessage(location.state) !== null) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  const shown = sortNewestFirst(filterByCategory(expenses, filter))

  function handleDelete(expense: Expense) {
    // window.confirm is built in, works with the keyboard and screen readers.
    if (window.confirm(`Delete "${expense.description}"? This cannot be undone.`)) {
      dispatch(expenseDeleted(expense.id))
    }
  }

  return (
    <div>
      <h1>Expenses</h1>

      {message !== null && (
        <p role="status" className="notice">
          {message}
          <button
            type="button"
            className="button link"
            onClick={() => {
              setMessage(null)
            }}
          >
            Dismiss
          </button>
        </p>
      )}

      {/* Balances use ALL expenses, even when the table is filtered. */}
      <BalanceList members={members} expenses={expenses} />

      <section aria-labelledby="expenses-heading">
        <h2 id="expenses-heading">All expenses</h2>

        {expenses.length === 0 ? (
          <div className="empty">
            <p>No expenses yet.</p>
            <Link to="/expenses/new">Add the first expense</Link>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <div className="field">
                <label htmlFor="category-filter">Category</label>
                <select
                  id="category-filter"
                  value={filter}
                  onChange={(event) => {
                    const value = event.target.value
                    if (isCategoryFilter(value)) {
                      setFilter(value)
                    }
                  }}
                >
                  <option value="All">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <p className="total" aria-live="polite">
                Total shown: <strong>{formatRupees(totalAmount(shown))}</strong>
              </p>
            </div>

            {shown.length === 0 ? (
              <div className="empty">
                <p>No expenses in the {filter} category.</p>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setFilter('All')
                  }}
                >
                  Show all categories
                </button>
              </div>
            ) : (
              <ExpenseTable expenses={shown} members={members} onDelete={handleDelete} />
            )}
          </>
        )}
      </section>
    </div>
  )
}
