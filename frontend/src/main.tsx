import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
