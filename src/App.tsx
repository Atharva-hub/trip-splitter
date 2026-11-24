import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import AddExpensePage from './pages/AddExpensePage'
import ExpensesPage from './pages/ExpensesPage'
import NotFoundPage from './pages/NotFoundPage'

// The router (BrowserRouter) and the Redux Provider wrap this in main.tsx.
export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<ExpensesPage />} />
          <Route path="/expenses/new" element={<AddExpensePage />} />
          {/* "*" matches every other URL */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}
