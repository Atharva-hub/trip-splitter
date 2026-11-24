import { configureStore } from '@reduxjs/toolkit'
import { loadExpenses, saveExpenses } from '../logic/storage'
import tripReducer, { makeInitialState, sampleData } from './tripSlice'
import type { TripState } from './tripSlice'

// A function (not a single global store) so each test can make its own fresh store.
export function makeStore(preloadedTrip?: TripState) {
  return configureStore({
    reducer: { trip: tripReducer },
    preloadedState: preloadedTrip ? { trip: preloadedTrip } : undefined,
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

// The store the real app uses: starts from localStorage (or the sample data)...
export function makeAppStore(storage: Storage = window.localStorage): AppStore {
  const saved = loadExpenses(storage, sampleData.members)
  const store = makeStore(makeInitialState(saved))

  // ...and saves the expenses every time they change.
  // WHY HERE: it is the one place that sees every change, so components never need
  // to remember to save, and reducers stay pure (no side effects inside them).
  let lastSaved = store.getState().trip.expenses
  store.subscribe(() => {
    const current = store.getState().trip.expenses
    if (current !== lastSaved) {
      lastSaved = current
      saveExpenses(storage, current)
    }
  })
  return store
}
