import { NavLink } from 'react-router-dom'

// NavLink adds aria-current="page" and the class "active" to the link of the
// page we are on. "end" stops "/" from also counting as active on /expenses/new.
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
