import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Member } from '../types'
import ExpenseForm from './ExpenseForm'

const members: Member[] = [
  { id: 'm1', name: 'Aarav' },
  { id: 'm2', name: 'Diya' },
  { id: 'm3', name: 'Kabir' },
]
const TODAY = '2026-06-15'

function setup() {
  const onSave = vi.fn()
  const onCancel = vi.fn()
  const user = userEvent.setup()
  render(<ExpenseForm members={members} onSave={onSave} onCancel={onCancel} today={TODAY} />)
  return { user, onSave, onCancel }
}

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Description'), 'Dinner')
  await user.type(screen.getByLabelText('Amount (₹)'), '300')
  await user.selectOptions(screen.getByLabelText('Paid by'), 'Aarav')
  await user.selectOptions(screen.getByLabelText('Category'), 'Food')
}

describe('ExpenseForm: invalid input', () => {
  it('shows an error next to every broken field and does not save', async () => {
    const { user, onSave } = setup()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText('Description')).toHaveAccessibleDescription('Description is required')
    expect(screen.getByLabelText('Amount (₹)')).toHaveAccessibleDescription('Amount is required')
    expect(screen.getByLabelText('Paid by')).toHaveAccessibleDescription('Choose who paid')
    expect(screen.getByLabelText('Category')).toHaveAccessibleDescription('Choose a category')
    expect(screen.getByLabelText('Description')).toBeInvalid()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('does not show any errors before Save is pressed', () => {
    setup()
    expect(screen.queryByText('Description is required')).not.toBeInTheDocument()
  })

  it('moves the keyboard focus to the first field with an error', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByLabelText('Description')).toHaveFocus()
  })

  it('shows "Amount must be more than ₹0" for a negative amount', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    await user.clear(screen.getByLabelText('Amount (₹)'))
    await user.type(screen.getByLabelText('Amount (₹)'), '-20')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Amount must be more than ₹0')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('rejects a date in the future', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-06-16' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Date cannot be in the future')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('needs at least one member for an equal split', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    for (const name of ['Aarav', 'Diya', 'Kabir']) {
      await user.click(screen.getByRole('checkbox', { name }))
    }
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Select at least one member')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('says how much is left to assign for exact amounts', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    await user.click(screen.getByRole('radio', { name: 'Exact amounts' }))
    await user.type(screen.getByLabelText('Aarav'), '100')
    await user.type(screen.getByLabelText('Diya'), '187.50')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('₹12.50 left to assign')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows an error next to a percentage box that is out of range', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    await user.click(screen.getByRole('radio', { name: 'Percentages' }))
    await user.type(screen.getByLabelText('Aarav'), '150')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText('Aarav')).toHaveAccessibleDescription('Must be between 0 and 100')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('removes an error as soon as the field is fixed', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Description is required')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Description'), 'Taxi')
    expect(screen.queryByText('Description is required')).not.toBeInTheDocument()
  })
})

describe('ExpenseForm: valid input', () => {
  it('saves an equal split between everyone by default', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      description: 'Dinner',
      amount: 30000,
      paidBy: 'm1',
      date: TODAY,
      category: 'Food',
      split: { type: 'equal', memberIds: ['m1', 'm2', 'm3'] },
    })
  })

  it('saves an equal split between only the selected members', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    await user.click(screen.getByRole('checkbox', { name: 'Kabir' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ split: { type: 'equal', memberIds: ['m1', 'm2'] } }),
    )
  })

  it('saves exact amounts that add up', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    await user.click(screen.getByRole('radio', { name: 'Exact amounts' }))
    await user.type(screen.getByLabelText('Aarav'), '100.50')
    await user.type(screen.getByLabelText('Kabir'), '199.50')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 30000,
        split: { type: 'exact', shares: { m1: 10050, m3: 19950 } },
      }),
    )
  })

  it('saves percentages that add up to 100', async () => {
    const { user, onSave } = setup()
    await fillBasics(user)
    await user.click(screen.getByRole('radio', { name: 'Percentages' }))
    await user.type(screen.getByLabelText('Aarav'), '60')
    await user.type(screen.getByLabelText('Diya'), '40')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ split: { type: 'percent', shares: { m1: 60, m2: 40 } } }),
    )
  })
})

describe('ExpenseForm: cancel', () => {
  it('calls onCancel and saves nothing', async () => {
    const { user, onSave, onCancel } = setup()
    await user.type(screen.getByLabelText('Description'), 'Something')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })
})
