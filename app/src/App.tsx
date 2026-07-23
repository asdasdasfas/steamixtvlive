import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { LangProvider } from '@/lib/language'
import Login from '@/pages/Login'
import AvatarSelect from '@/pages/AvatarSelect'
import Dashboard from '@/pages/Dashboard'
import Watch from '@/pages/Watch'
import Detail from '@/pages/Detail'
import Profile from '@/pages/Profile'
import Subscription from '@/pages/Subscription'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AvatarGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user && !user.avatar) return <Navigate to="/avatar" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.avatar) return <Navigate to="/avatar" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
        <LangProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/avatar" element={<ProtectedRoute><AvatarSelect /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><AvatarGuard><Dashboard /></AvatarGuard></ProtectedRoute>} />
            <Route path="/watch" element={<ProtectedRoute><AvatarGuard><Watch /></AvatarGuard></ProtectedRoute>} />
            <Route path="/detail" element={<ProtectedRoute><AvatarGuard><Detail /></AvatarGuard></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AvatarGuard><Profile /></AvatarGuard></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><AvatarGuard><Subscription /></AvatarGuard></ProtectedRoute>} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  )
}
