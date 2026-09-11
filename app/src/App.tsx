import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from '@/lib/language'
import Landing from '@/pages/Landing'
import AnimatedBackground from '@/sections/AnimatedBackground'

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AnimatedBackground />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LangProvider>
    </BrowserRouter>
  )
}
