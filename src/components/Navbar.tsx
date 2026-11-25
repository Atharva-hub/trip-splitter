import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="navbar">
      <nav aria-label="Main" className="navbar-inner">
        <span className="brand">Trip Splitter</span>
        <NavLink to="/" end>
          Expenses
        </NavLink>
        <NavLink to="/expenses/new">Add expense</NavLink>
      </nav>
    </header>
  )
}
