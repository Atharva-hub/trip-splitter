import { configureStore } from '@reduxjs/toolkit'
import { loadExpenses, saveExpenses } from '../logic/storage'
import tripReducer, { makeInitialState, sampleData } from './tripSlice'
import type { TripState } from './tripSlice'

export function makeStore(preloadedTrip?: TripState) {
  return configureStore({
    reducer: { trip: tripReducer },
    preloadedState: preloadedTrip ? { trip: preloadedTrip } : undefined,
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

export function makeAppStore(storage: Storage = window.localStorage): AppStore {
  const saved = loadExpenses(storage, sampleData.members)
  const store = makeStore(makeInitialState(saved))

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
