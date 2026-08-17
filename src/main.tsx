import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { InstitutionProvider } from './context/InstitutionContext'
import './index.css'

// BrowserRouter for Vercel (SPA rewrites in vercel.json).
// Paths like /admin and /ask work as normal URLs.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <InstitutionProvider>
        <App />
      </InstitutionProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
