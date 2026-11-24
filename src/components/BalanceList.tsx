import { calculateBalances, describeBalance } from '../logic/balances'
import type { Expense, Member } from '../types'

interface Props {
  members: Member[]
  expenses: Expense[]
}

export default function BalanceList({ members, expenses }: Props) {
  const balances = calculateBalances(members, expenses)

  return (
    <section aria-labelledby="balances-heading">
      <h2 id="balances-heading">Balances</h2>
      <ul className="balances">
        {members.map((member) => {
          const balance = balances[member.id] ?? 0
          // The words carry the meaning; the colour is only a bonus.
          const tone = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral'
          return (
            <li key={member.id} className={`balance ${tone}`}>
              <span className="balance-name">{member.name}</span>
              <span>{describeBalance(balance)}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
