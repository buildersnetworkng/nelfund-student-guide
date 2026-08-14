import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { InstitutionProvider } from './context/InstitutionContext'
import './index.css'

// BrowserRouter + vercel.json rewrites for clean URLs on Vercel.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <InstitutionProvider>
        <App />
      </InstitutionProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
