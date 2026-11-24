import { useEffect, useRef, useState } from 'react'
import type { ReactNode, SubmitEvent } from 'react'
import { todayISO } from '../logic/dates'
import { makeEmptyFormValues } from '../logic/formValues'
import { validateExpenseForm } from '../logic/validation'
import { CATEGORIES } from '../types'
import type { ExpenseFormValues, FormErrors, Member, NewExpense, SplitType } from '../types'

interface Props {
  members: Member[]
  onSave: (expense: NewExpense) => void
  onCancel: () => void
  today?: string // lets tests pick "today"; the real app uses the real date
}

const SPLIT_OPTIONS: { type: SplitType; label: string }[] = [
  { type: 'equal', label: 'Equally' },
  { type: 'exact', label: 'Exact amounts' },
  { type: 'percent', label: 'Percentages' },
]

// The two attributes that tell screen readers "this input is invalid, and here is why".
function errorProps(id: string, error: string | undefined) {
  return {
    'aria-invalid': error !== undefined,
    'aria-describedby': error !== undefined ? `${id}-error` : undefined,
  }
}

// Points a group of inputs at the message about the whole split (if there is one).
function splitErrorId(errors: FormErrors): string | undefined {
  return errors.split !== undefined ? 'split-error' : undefined
}

function ErrorMessage({ id, message }: { id: string; message: string | undefined }) {
  if (message === undefined) {
    return null
  }
  return (
    <p id={`${id}-error`} className="error">
      {message}
    </p>
  )
}

// A label + an input + its error message, stacked.
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error: string | undefined
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      <ErrorMessage id={id} message={error} />
    </div>
  )
}

export default function ExpenseForm({ members, onSave, onCancel, today = todayISO() }: Props) {
  // All the form's values live in ONE state object. Everything is text until we validate.
  const [values, setValues] = useState<ExpenseFormValues>(() => makeEmptyFormValues(members, today))
  // How many times Save was pressed. Errors only show after the first press.
  const [saveAttempts, setSaveAttempts] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  // Errors are DERIVED from the values on every render, not stored. So they
  // can never be out of date: fix a field and its error disappears at once.
  const result = validateExpenseForm(values, members, today)
  const errors: FormErrors = saveAttempts > 0 && !result.ok ? result.errors : {}

  // After a failed Save, move the keyboard focus to the first field with an error.
  useEffect(() => {
    if (saveAttempts > 0) {
      // Either an input marked invalid, or the first input of a split group that has an error.
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"], fieldset[aria-describedby] input')
        ?.focus()
    }
  }, [saveAttempts])

  function update<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  function updateShare(box: 'exactShares' | 'percentShares', memberId: string, text: string) {
    setValues((previous) => ({ ...previous, [box]: { ...previous[box], [memberId]: text } }))
  }

  function toggleMember(memberId: string) {
    setValues((previous) => ({
      ...previous,
      equalMemberIds: previous.equalMemberIds.includes(memberId)
        ? previous.equalMemberIds.filter((id) => id !== memberId)
        : [...previous.equalMemberIds, memberId],
    }))
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault() // stop the browser reloading the page
    setSaveAttempts((count) => count + 1)
    if (result.ok) {
      onSave(result.expense)
    }
  }

  return (
    // noValidate: we do our own validation, so the browser's pop-ups stay out of the way.
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="form">
      <Field id="description" label="Description" error={errors.description}>
        <input
          id="description"
          type="text"
          value={values.description}
          onChange={(event) => {
            update('description', event.target.value)
          }}
          {...errorProps('description', errors.description)}
        />
      </Field>

      <Field id="amount" label="Amount (₹)" error={errors.amount}>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          value={values.amount}
          onChange={(event) => {
            update('amount', event.target.value)
          }}
          {...errorProps('amount', errors.amount)}
        />
      </Field>

      <Field id="paidBy" label="Paid by" error={errors.paidBy}>
        <select
          id="paidBy"
          value={values.paidBy}
          onChange={(event) => {
            update('paidBy', event.target.value)
          }}
          {...errorProps('paidBy', errors.paidBy)}
        >
          <option value="">Select a member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id="date" label="Date" error={errors.date}>
        <input
          id="date"
          type="date"
          max={today}
          value={values.date}
          onChange={(event) => {
            update('date', event.target.value)
          }}
          {...errorProps('date', errors.date)}
        />
      </Field>

      <Field id="category" label="Category" error={errors.category}>
        <select
          id="category"
          value={values.category}
          onChange={(event) => {
            update('category', event.target.value)
          }}
          {...errorProps('category', errors.category)}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="split">
        <legend>Split</legend>

        <div className="radio-row">
          {SPLIT_OPTIONS.map((option) => (
            <label key={option.type} className="choice">
              <input
                type="radio"
                name="splitType"
                checked={values.splitType === option.type}
                onChange={() => {
                  update('splitType', option.type)
                }}
              />
              {option.label}
            </label>
          ))}
        </div>

        {values.splitType === 'equal' && (
          <fieldset className="member-group" aria-describedby={splitErrorId(errors)}>
            <legend>Split equally between</legend>
            {members.map((member) => (
              <label key={member.id} className="choice">
                <input
                  type="checkbox"
                  checked={values.equalMemberIds.includes(member.id)}
                  onChange={() => {
                    toggleMember(member.id)
                  }}
                />
                {member.name}
              </label>
            ))}
          </fieldset>
        )}

        {values.splitType === 'exact' && (
          <ShareBoxes
            legend="Amount for each member (₹)"
            members={members}
            boxes={values.exactShares}
            idPrefix="exact"
            errors={errors}
            onChange={(memberId, text) => {
              updateShare('exactShares', memberId, text)
            }}
          />
        )}

        {values.splitType === 'percent' && (
          <ShareBoxes
            legend="Percentage for each member (%)"
            members={members}
            boxes={values.percentShares}
            idPrefix="percent"
            errors={errors}
            onChange={(memberId, text) => {
              updateShare('percentShares', memberId, text)
            }}
          />
        )}

        <ErrorMessage id="split" message={errors.split} />
      </fieldset>

      <div className="actions">
        <button type="submit" className="button primary">
          Save
        </button>
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// One text box per member, used by both "Exact amounts" and "Percentages".
function ShareBoxes({
  legend,
  members,
  boxes,
  idPrefix,
  errors,
  onChange,
}: {
  legend: string
  members: Member[]
  boxes: Record<string, string>
  idPrefix: string
  errors: FormErrors
  onChange: (memberId: string, text: string) => void
}) {
  return (
    <fieldset className="member-group" aria-describedby={splitErrorId(errors)}>
      <legend>{legend}</legend>
      {members.map((member) => {
        const id = `${idPrefix}-${member.id}`
        const error = errors.shares?.[member.id]
        return (
          <Field key={member.id} id={id} label={member.name} error={error}>
            <input
              id={id}
              type="text"
              inputMode="decimal"
              value={boxes[member.id] ?? ''}
              onChange={(event) => {
                onChange(member.id, event.target.value)
              }}
              {...errorProps(id, error)}
            />
          </Field>
        )
      })}
    </fieldset>
  )
}
