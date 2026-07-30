import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Mediabunny AC-3/E-AC-3 decoder: browser'da Dolby Digital ses desteği
import { registerAc3Decoder } from '@mediabunny/ac3'
import { initAntiInspect } from '@/lib/anti-inspect'
registerAc3Decoder()
initAntiInspect()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
