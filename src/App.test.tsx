import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './logic/storage'
import { makeAppStore } from './store/store'

// Renders the whole app (like main.tsx does), starting at `path`.
function renderApp(path = '/') {
  const store = makeAppStore(window.localStorage)
  const user = userEvent.setup()
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Provider>,
  )
  return { user, store }
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('navigation', () => {
  it('marks the current page in the navbar', () => {
    renderApp('/expenses/new')
    expect(screen.getByRole('link', { name: 'Add expense' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Expenses' })).not.toHaveAttribute('aria-current')
  })

  it('navigates between the two pages', async () => {
    const { user } = renderApp('/')
    expect(screen.getByRole('link', { name: 'Expenses' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('link', { name: 'Add expense' }))
    expect(screen.getByRole('heading', { name: 'Add expense' })).toBeInTheDocument()
  })

  it('shows "Page not found" with a link back for any other URL', async () => {
    const { user } = renderApp('/nothing/here')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Back to Expenses' }))
    expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument()
  })
})

describe('Expenses page', () => {
  it('shows every member balance from the sample data', () => {
    renderApp()
    const balances = within(screen.getByRole('region', { name: 'Balances' }))
    expect(balances.getByText('gets back ₹18,554.20')).toBeInTheDocument() // Aarav
    expect(balances.getByText('owes ₹3,695.78')).toBeInTheDocument() // Diya
    expect(balances.getByText('gets back ₹554.08')).toBeInTheDocument() // Kabir
    expect(balances.getByText('owes ₹8,112.50')).toBeInTheDocument() // Meera
    expect(balances.getByText('owes ₹7,300.00')).toBeInTheDocument() // Rohan
  })

  it('lists expenses newest date first with the split described', () => {
    renderApp()
    const rows = screen.getAllByRole('row').slice(1) // skip the header row
    expect(rows).toHaveLength(6)
    expect(within(rows[0] ?? document.body).getByText('Airport cab')).toBeInTheDocument()
    expect(within(rows[5] ?? document.body).getByText('Villa booking')).toBeInTheDocument()
    expect(screen.getByText('Equally, 5 people')).toBeInTheDocument()
    expect(screen.getByText('₹24,000.00')).toBeInTheDocument()
  })

  it('filters by category and totals what is shown', async () => {
    const { user } = renderApp()
    expect(screen.getByText('₹42,249.99')).toBeInTheDocument() // total of all six

    await user.selectOptions(screen.getByLabelText('Category'), 'Food')
    expect(screen.getAllByRole('row')).toHaveLength(3) // header + 2 food expenses
    expect(screen.getByText('₹4,250.00')).toBeInTheDocument()
  })

  it('shows an empty state when the chosen category has no expenses', async () => {
    const { user } = renderApp()
    await user.selectOptions(screen.getByLabelText('Category'), 'Other')

    expect(screen.getByText('No expenses in the Other category.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show all categories' }))
    expect(screen.getAllByRole('row')).toHaveLength(7)
  })

  it('deletes an expense after the user confirms, and balances update', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Delete Villa booking' }))

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Villa booking')).not.toBeInTheDocument()
    // Aarav paid the villa (₹24,000) and owed ₹4,800 of it, so without it
    // his balance drops by ₹19,200: 18,554.20 - 19,200.00 = -645.80
    expect(screen.queryByText('gets back ₹18,554.20')).not.toBeInTheDocument()
    expect(screen.getByText('owes ₹645.80')).toBeInTheDocument()
  })

  it('keeps the expense when the user cancels the confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Delete Villa booking' }))

    expect(screen.getByText('Villa booking')).toBeInTheDocument()
    expect(screen.getByText('gets back ₹18,554.20')).toBeInTheDocument()
  })

  it('shows an empty state when every expense is deleted, and remembers it', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderApp()

    for (let i = 0; i < 6; i++) {
      const button = screen.getAllByRole('button', { name: /^Delete / })[0]
      if (button) {
        await user.click(button)
      }
    }

    expect(screen.getByText('No expenses yet.')).toBeInTheDocument()
    expect(screen.getAllByText('settled up')).toHaveLength(5)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })
})

describe('adding an expense', () => {
  it('saves a valid expense, goes to Expenses with a message, and updates balances', async () => {
    const { user, store } = renderApp('/expenses/new')

    await user.type(screen.getByLabelText('Description'), 'Sunset cruise')
    await user.type(screen.getByLabelText('Amount (₹)'), '1000')
    await user.selectOptions(screen.getByLabelText('Paid by'), 'Meera')
    await user.selectOptions(screen.getByLabelText('Category'), 'Activities')
    await user.click(screen.getByRole('radio', { name: 'Percentages' }))
    await user.type(screen.getByLabelText('Aarav'), '40')
    await user.type(screen.getByLabelText('Meera'), '60')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    // back on the Expenses page, with the message
    expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Expense added')
    expect(screen.getByText('Sunset cruise')).toBeInTheDocument()
    expect(screen.getByText('By percentage, 2 people')).toBeInTheDocument()

    // Aarav owes 400 more (18,554.20 - 400.00), Meera is owed 400 more (-8,112.50 + 400.00)
    expect(screen.getByText('gets back ₹18,154.20')).toBeInTheDocument()
    expect(screen.getByText('owes ₹7,712.50')).toBeInTheDocument()

    expect(store.getState().trip.expenses).toHaveLength(7)
  })

  it('does not save anything when the form is invalid', async () => {
    const { user, store } = renderApp('/expenses/new')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('heading', { name: 'Add expense' })).toBeInTheDocument()
    expect(store.getState().trip.expenses).toHaveLength(6)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('goes back to Expenses on Cancel without saving', async () => {
    const { user, store } = renderApp('/expenses/new')
    await user.type(screen.getByLabelText('Description'), 'Never saved')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument()
    expect(store.getState().trip.expenses).toHaveLength(6)
  })
})

describe('saving to localStorage', () => {
  it('survives a "page reload" (a brand new store reads what was saved)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const first = renderApp()
    await first.user.click(screen.getByRole('button', { name: 'Delete Airport cab' }))

    const reloadedStore = makeAppStore(window.localStorage)
    const ids = reloadedStore.getState().trip.expenses.map((e) => e.id)
    expect(ids).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
  })

  it('starts from the sample data when the saved data cannot be read', () => {
    window.localStorage.setItem(STORAGE_KEY, 'this is not json')
    const store = makeAppStore(window.localStorage)
    expect(store.getState().trip.expenses).toHaveLength(6)
  })
})
