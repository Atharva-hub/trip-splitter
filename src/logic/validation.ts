import { CATEGORIES } from '../types'
import type {
  Category,
  ExpenseFormValues,
  FormErrors,
  Member,
  Split,
  ValidationResult,
} from '../types'
import { isValidISODate } from './dates'
import { formatPercent, formatRupees, parseScaledNumber } from './money'
import { isCategory } from './parse'

export const MAX_DESCRIPTION_LENGTH = 60
export const MAX_AMOUNT_PAISE = 1_000_000 * 100 // ₹10,00,000

const startsWithMinus = (text: string) => text.trim().startsWith('-')

// Each helper below returns either the clean value or an error message.
type Checked<T> = { value: T; error?: undefined } | { value: null; error: string }

function checkDescription(text: string): Checked<string> {
  const description = text.trim()
  if (description === '') {
    return { value: null, error: 'Description is required' }
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      value: null,
      error: `Description must be at most ${String(MAX_DESCRIPTION_LENGTH)} characters`,
    }
  }
  return { value: description }
}

function checkAmount(text: string): Checked<number> {
  if (text.trim() === '') {
    return { value: null, error: 'Amount is required' }
  }
  if (startsWithMinus(text)) {
    return { value: null, error: 'Amount must be more than ₹0' }
  }
  const parsed = parseScaledNumber(text, 2)
  if (!parsed.ok) {
    return {
      value: null,
      error:
        parsed.reason === 'too-many-decimals'
          ? 'Amount can have at most 2 decimal places'
          : 'Enter a valid amount, like 250 or 250.50',
    }
  }
  if (parsed.value <= 0) {
    return { value: null, error: 'Amount must be more than ₹0' }
  }
  if (parsed.value > MAX_AMOUNT_PAISE) {
    return { value: null, error: `Amount can be at most ${formatRupees(MAX_AMOUNT_PAISE)}` }
  }
  return { value: parsed.value }
}

function checkPaidBy(id: string, members: Member[]): Checked<string> {
  if (id === '') {
    return { value: null, error: 'Choose who paid' }
  }
  if (!members.some((member) => member.id === id)) {
    return { value: null, error: 'Choose a member from the list' }
  }
  return { value: id }
}

function checkDate(text: string, today: string): Checked<string> {
  if (text === '') {
    return { value: null, error: 'Date is required' }
  }
  if (!isValidISODate(text)) {
    return { value: null, error: 'Enter a valid date' }
  }
  if (text > today) {
    // YYYY-MM-DD strings compare correctly as plain text
    return { value: null, error: 'Date cannot be in the future' }
  }
  return { value: text }
}

function checkCategory(text: string): Checked<Category> {
  if (text === '') {
    return { value: null, error: 'Choose a category' }
  }
  if (!isCategory(text)) {
    return { value: null, error: `Category must be one of: ${CATEGORIES.join(', ')}` }
  }
  return { value: text }
}

// The result of checking the split section of the form.
interface SplitCheck {
  split: Split | null
  error?: string // about the split as a whole
  shareErrors: Record<string, string> // about one member's box
}

// Reads one box per member ("exact" and "percent" splits).
// Blank boxes count as 0. Returns the numbers (in hundredths) and any per-box errors.
function readShareBoxes(
  members: Member[],
  boxes: Record<string, string>,
  wrongNumberMessage: string,
  isTooBig: (value: number) => boolean,
) {
  const values: Record<string, number> = {}
  const shareErrors: Record<string, string> = {}

  for (const member of members) {
    const text = boxes[member.id] ?? ''
    if (text.trim() === '') {
      continue
    }
    const parsed = parseScaledNumber(text, 2)
    if (!parsed.ok) {
      shareErrors[member.id] =
        parsed.reason === 'too-many-decimals' ? 'Use at most 2 decimal places' : 'Enter a number'
    } else if (parsed.value < 0 || isTooBig(parsed.value)) {
      shareErrors[member.id] = wrongNumberMessage
    } else if (parsed.value > 0) {
      values[member.id] = parsed.value // members left at 0 are simply not part of the split
    }
  }
  return { values, shareErrors }
}

function checkEqualSplit(values: ExpenseFormValues, members: Member[]): SplitCheck {
  // Keep the members' own order so the "extra paisa" rule is predictable.
  const memberIds = members
    .filter((member) => values.equalMemberIds.includes(member.id))
    .map((member) => member.id)

  if (memberIds.length === 0) {
    return { split: null, error: 'Select at least one member', shareErrors: {} }
  }
  return { split: { type: 'equal', memberIds }, shareErrors: {} }
}

function checkExactSplit(
  values: ExpenseFormValues,
  members: Member[],
  amount: number | null,
): SplitCheck {
  const { values: shares, shareErrors } = readShareBoxes(
    members,
    values.exactShares,
    'Must be ₹0 or more',
    () => false,
  )
  if (Object.keys(shareErrors).length > 0 || amount === null) {
    // If the amount itself is wrong we cannot compare the total yet.
    return { split: null, shareErrors }
  }

  const total = Object.values(shares).reduce((sum, paise) => sum + paise, 0)
  if (total < amount) {
    return { split: null, error: `${formatRupees(amount - total)} left to assign`, shareErrors }
  }
  if (total > amount) {
    return { split: null, error: `${formatRupees(total - amount)} over the amount`, shareErrors }
  }
  return { split: { type: 'exact', shares }, shareErrors }
}

function checkPercentSplit(values: ExpenseFormValues, members: Member[]): SplitCheck {
  const { values: hundredths, shareErrors } = readShareBoxes(
    members,
    values.percentShares,
    'Must be between 0 and 100',
    (value) => value > 10000,
  )
  if (Object.keys(shareErrors).length > 0) {
    return { split: null, shareErrors }
  }

  const total = Object.values(hundredths).reduce((sum, h) => sum + h, 0)
  if (total < 10000) {
    return { split: null, error: `${formatPercent(10000 - total)}% left to assign`, shareErrors }
  }
  if (total > 10000) {
    return { split: null, error: `${formatPercent(total - 10000)}% over 100%`, shareErrors }
  }

  // Store percentages as normal numbers (3333 -> 33.33), like the sample data.
  const shares: Record<string, number> = {}
  for (const [memberId, h] of Object.entries(hundredths)) {
    shares[memberId] = h / 100
  }
  return { split: { type: 'percent', shares }, shareErrors }
}

// The one function the form calls on Save.
//  - Everything fine -> { ok: true, expense } with clean, typed values.
//  - Anything wrong  -> { ok: false, errors } with a message for EVERY broken field.
// `today` is passed in (not read inside) so tests can use any date they like.
export function validateExpenseForm(
  values: ExpenseFormValues,
  members: Member[],
  today: string,
): ValidationResult {
  const description = checkDescription(values.description)
  const amount = checkAmount(values.amount)
  const paidBy = checkPaidBy(values.paidBy, members)
  const date = checkDate(values.date, today)
  const category = checkCategory(values.category)

  let splitCheck: SplitCheck
  if (values.splitType === 'equal') {
    splitCheck = checkEqualSplit(values, members)
  } else if (values.splitType === 'exact') {
    splitCheck = checkExactSplit(values, members, amount.value)
  } else {
    splitCheck = checkPercentSplit(values, members)
  }

  if (
    description.value === null ||
    amount.value === null ||
    paidBy.value === null ||
    date.value === null ||
    category.value === null ||
    splitCheck.split === null
  ) {
    const errors: FormErrors = {}
    if (description.error) errors.description = description.error
    if (amount.error) errors.amount = amount.error
    if (paidBy.error) errors.paidBy = paidBy.error
    if (date.error) errors.date = date.error
    if (category.error) errors.category = category.error
    if (splitCheck.error) errors.split = splitCheck.error
    if (Object.keys(splitCheck.shareErrors).length > 0) errors.shares = splitCheck.shareErrors
    return { ok: false, errors }
  }

  return {
    ok: true,
    expense: {
      description: description.value,
      amount: amount.value,
      paidBy: paidBy.value,
      date: date.value,
      category: category.value,
      split: splitCheck.split,
    },
  }
}
