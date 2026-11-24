import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import sampleJson from '../data/sample-data.json'
import { parseTripData } from '../logic/parse'
import type { Expense, Member, NewExpense, TripData } from '../types'

// What Redux holds: the trip members and the list of expenses. (Things that only
// one screen cares about, like form text or the chosen filter, stay in components.)
export type TripState = TripData

// Check the sample data once, so the rest of the app can trust its types.
const sample = parseTripData(sampleJson)
if (sample === null) {
  throw new Error('src/data/sample-data.json is not valid')
}
export const sampleData: TripData = sample

export function makeInitialState(savedExpenses: Expense[] | null): TripState {
  return {
    members: sampleData.members,
    // nothing saved (or unreadable) -> start from the sample expenses
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
      // "prepare" runs BEFORE the reducer. It creates the id here, so the reducer
      // stays pure (same input -> same output, no randomness inside it).
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

// "Selectors": small functions that read one piece of the state.
export const selectMembers = (state: { trip: TripState }): Member[] => state.trip.members
export const selectExpenses = (state: { trip: TripState }): Expense[] => state.trip.expenses
