import { useNavigate } from 'react-router-dom'
import ExpenseForm from '../components/ExpenseForm'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { expenseAdded, selectMembers } from '../store/tripSlice'
import type { NewExpense } from '../types'

export default function AddExpensePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const members = useAppSelector(selectMembers)

  function handleSave(expense: NewExpense) {
    dispatch(expenseAdded(expense))
    void navigate('/', { state: { flash: 'Expense added' } })
  }

  function handleCancel() {
    void navigate('/')
  }

  return (
    <div className="form-page">
      <h1>Add expense</h1>
      <ExpenseForm members={members} onSave={handleSave} onCancel={handleCancel} />
    </div>
  )
}
