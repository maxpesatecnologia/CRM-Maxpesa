import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CRMProvider } from './context/CRMContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CRMProvider>
        <App />
      </CRMProvider>
    </AuthProvider>
  </StrictMode>,
)
