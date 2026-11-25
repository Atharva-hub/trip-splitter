import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import sampleJson from '../data/sample-data.json'
import { parseTripData } from '../logic/parse'
import type { Expense, Member, NewExpense, TripData } from '../types'

export type TripState = TripData

const sample = parseTripData(sampleJson)
if (sample === null) {
  throw new Error('src/data/sample-data.json is not valid')
}
export const sampleData: TripData = sample

export function makeInitialState(savedExpenses: Expense[] | null): TripState {
  return {
    members: sampleData.members,
    expenses: savedExpenses ?? sampleData.expenses,
  }
}

const tripSlice = createSlice({
  name: 'trip',
  initialState: makeInitialState(null),
  reducers: {
    expenseAdded: {
      reducer(state, action: PayloadAction<Expense>) {
        state.expenses.push(action.payload)
      },
      prepare(newExpense: NewExpense) {
        return { payload: { ...newExpense, id: nanoid() } }
      },
    },
    expenseDeleted(state, action: PayloadAction<string>) {
      state.expenses = state.expenses.filter((expense) => expense.id !== action.payload)
    },
  },
})

export const { expenseAdded, expenseDeleted } = tripSlice.actions
export default tripSlice.reducer

export const selectMembers = (state: { trip: TripState }): Member[] => state.trip.members
export const selectExpenses = (state: { trip: TripState }): Expense[] => state.trip.expenses
