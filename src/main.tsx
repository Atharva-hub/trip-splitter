import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { makeAppStore } from './store/store'
import './styles.css'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Could not find the #root element in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={makeAppStore()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
