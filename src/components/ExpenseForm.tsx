import { useEffect, useRef, useState } from 'react'
import type { ReactNode, SubmitEvent } from 'react'
import { todayISO } from '../logic/dates'
import { makeEmptyFormValues } from '../logic/formValues'
import { formatRupees } from '../logic/money'
import { previewShares } from '../logic/splitPreview'
import { MAX_DESCRIPTION_LENGTH, validateExpenseForm } from '../logic/validation'
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

const SPLIT_HEADINGS: Record<SplitType, string> = {
  equal: 'Participants',
  exact: 'Amount for each member (₹)',
  percent: 'Percentage for each member (%)',
}

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

// A label + an input + its error message, stacked. `hint` is small text on the label's right.
function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error: string | undefined
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor={id}>{label}</label>
        {hint}
      </div>
      {children}
      <ErrorMessage id={id} message={error} />
    </div>
  )
}

// The text on the right of a participant: their share, or a dash when they have none.
function ShareText({ paise }: { paise: number | undefined }) {
  if (paise === undefined) {
    return (
      <span className="participant-share muted">
        <span aria-hidden="true">—</span>
        <span className="visually-hidden">No share</span>
      </span>
    )
  }
  return <span className="participant-share">{formatRupees(paise)}</span>
}

export default function ExpenseForm({ members, onSave, onCancel, today = todayISO() }: Props) {
  // All the form's values live in ONE state object. Everything is text until we validate.
  const [values, setValues] = useState<ExpenseFormValues>(() => makeEmptyFormValues(members, today))
  // How many times Save was pressed. Errors only show after the first press.
  const [saveAttempts, setSaveAttempts] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  // Errors and the live shares are DERIVED from the values on every render, not stored.
  // So they can never be out of date: fix a field and its error disappears at once.
  const result = validateExpenseForm(values, members, today)
  const errors: FormErrors = saveAttempts > 0 && !result.ok ? result.errors : {}
  const shares = previewShares(values, members)

  // After a failed Save, move the keyboard focus to the first field with an error.
  useEffect(() => {
    if (saveAttempts > 0) {
      // Either an input marked invalid, or the first input of the split group if the split has an error.
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"], [role="group"][aria-describedby] input')
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

  function selectAllMembers(selected: boolean) {
    update('equalMemberIds', selected ? members.map((member) => member.id) : [])
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault() // stop the browser reloading the page
    setSaveAttempts((count) => count + 1)
    if (result.ok) {
      onSave(result.expense)
    }
  }

  const descriptionTooLong = values.description.length > MAX_DESCRIPTION_LENGTH

  return (
    // noValidate: we do our own validation, so the browser's pop-ups stay out of the way.
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="expense-form">
      {/* Amount comes first: it is the main thing you come here to enter. */}
      <div className="amount-card">
        <label htmlFor="amount">Amount (₹)</label>
        <div className="amount-input">
          <span className="amount-symbol" aria-hidden="true">
            ₹
          </span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            autoFocus
            value={values.amount}
            onChange={(event) => {
              update('amount', event.target.value)
            }}
            {...errorProps('amount', errors.amount)}
          />
        </div>
        <ErrorMessage id="amount" message={errors.amount} />
      </div>

      <Field
        id="description"
        label="Description"
        error={errors.description}
        hint={
          <span className={descriptionTooLong ? 'counter over' : 'counter'}>
            {values.description.length} / {MAX_DESCRIPTION_LENGTH}
          </span>
        }
      >
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

      <div className="row-2">
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
      </div>

      <Field id="date" label="Date" error={errors.date}>
        <div className="with-icon">
          <span className="icon" aria-hidden="true">
            📅
          </span>
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
        </div>
      </Field>

      <fieldset className="split-method">
        <legend>Split method</legend>
        <div className="segmented">
          {SPLIT_OPTIONS.map((option) => (
            <label key={option.type} className="segment">
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
      </fieldset>

      <div
        role="group"
        aria-labelledby="participants-heading"
        aria-describedby={splitErrorId(errors)}
      >
        <div className="participants-header">
          <h2 id="participants-heading" className="section-title">
            {SPLIT_HEADINGS[values.splitType]}
          </h2>
          {values.splitType === 'equal' && (
            <div className="select-actions">
              <button
                type="button"
                className="button small"
                onClick={() => {
                  selectAllMembers(true)
                }}
              >
                Select all
              </button>
              <button
                type="button"
                className="button small"
                onClick={() => {
                  selectAllMembers(false)
                }}
              >
                Deselect all
              </button>
            </div>
          )}
        </div>

        {values.splitType === 'equal' ? (
          <ul className="participant-list">
            {members.map((member) => (
              <li key={member.id} className="participant-row">
                <label className="participant-name">
                  <input
                    type="checkbox"
                    checked={values.equalMemberIds.includes(member.id)}
                    onChange={() => {
                      toggleMember(member.id)
                    }}
                  />
                  {member.name}
                </label>
                <ShareText paise={shares[member.id]} />
              </li>
            ))}
          </ul>
        ) : (
          <ShareRows
            members={members}
            splitType={values.splitType}
            boxes={values.splitType === 'exact' ? values.exactShares : values.percentShares}
            shares={shares}
            errors={errors}
            onChange={(memberId, text) => {
              updateShare(values.splitType === 'exact' ? 'exactShares' : 'percentShares', memberId, text)
            }}
          />
        )}

        <ErrorMessage id="split" message={errors.split} />
      </div>

      <div className="actions">
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button primary">
          Save expense
        </button>
      </div>
    </form>
  )
}

// One row per member with a text box, used by both "Exact amounts" and "Percentages".
function ShareRows({
  members,
  splitType,
  boxes,
  shares,
  errors,
  onChange,
}: {
  members: Member[]
  splitType: SplitType
  boxes: Record<string, string>
  shares: Record<string, number>
  errors: FormErrors
  onChange: (memberId: string, text: string) => void
}) {
  const isPercent = splitType === 'percent'

  return (
    <ul className="participant-list">
      {members.map((member) => {
        const id = `${splitType}-${member.id}`
        const error = errors.shares?.[member.id]
        return (
          <li key={member.id} className={isPercent ? 'participant-row with-preview' : 'participant-row'}>
            <label htmlFor={id} className="participant-name">
              {member.name}
            </label>
            <div className={isPercent ? 'share-input suffix' : 'share-input prefix'}>
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
              <span className="share-unit" aria-hidden="true">
                {isPercent ? '%' : '₹'}
              </span>
            </div>
            {isPercent && <ShareText paise={shares[member.id]} />}
            <ErrorMessage id={id} message={error} />
          </li>
        )
      })}
    </ul>
  )
}
