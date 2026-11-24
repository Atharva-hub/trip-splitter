import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>We could not find the page you were looking for.</p>
      <Link to="/">Back to Expenses</Link>
    </div>
  )
}
