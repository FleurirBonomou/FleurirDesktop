import './assets/main.css'
import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism-tomorrow.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { HashRouter } from 'react-router-dom'
import { applyStoredTheme } from './lib/theme'

// Applique le thème persisté AVANT le premier rendu (évite le flash du thème).
applyStoredTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
