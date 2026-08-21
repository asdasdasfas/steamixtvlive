import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { LangProvider } from '@/lib/language'
import { slugify } from '@/lib/utils'
import Login from '@/pages/Login'
import AvatarSelect from '@/pages/AvatarSelect'
import Dashboard from '@/pages/Dashboard'
import Watch from '@/pages/Watch'
import Detail from '@/pages/Detail'
import Profile from '@/pages/Profile'
import Subscription from '@/pages/Subscription'
import AnimatedBackground from '@/sections/AnimatedBackground'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>
    <AnimatedBackground />
    {children}
  </>
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

// Eski query-tabánlı linkleri yeni clean URL'ye yönlendir (geriye dönük uyumluluk)
function RedirectOldDetail() {
  const [sp] = useSearchParams()
  const id = sp.get('id')
  const type = sp.get('type') || 'movie'
  const name = sp.get('name') || ''
  return <Navigate to={id ? `/detail/${type}/${id}/${slugify(name)}` : '/dashboard'} replace />
}

function RedirectOldWatch() {
  const [sp] = useSearchParams()
  const streamId = sp.get('stream_id')
  const rotationId = sp.get('rotation_id')
  const type = sp.get('type') || 'live'
  const season = sp.get('season') || '1'
  const episode = sp.get('episode') || '1'
  const seriesId = sp.get('series_id') || ''
  if (rotationId) return <Navigate to={`/watch/rotation/${rotationId}/${slugify(sp.get('name') || '')}`} replace />
  if (!streamId) return <Navigate to="/dashboard" replace />
  if (type === 'series') return <Navigate to={`/watch/series/${streamId}/${season}/${episode}/${seriesId}`} replace />
  return <Navigate to={`/watch/${type}/${streamId}/${slugify(sp.get('name') || '')}`} replace />
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
            <Route path="/watch/:type/:id/:slug?" element={<ProtectedRoute><AvatarGuard><Watch /></AvatarGuard></ProtectedRoute>} />
            <Route path="/watch/:type/:id/:season/:episode/:seriesId?/:slug?" element={<ProtectedRoute><AvatarGuard><Watch /></AvatarGuard></ProtectedRoute>} />
            <Route path="/detail/:type/:id/:slug?" element={<ProtectedRoute><AvatarGuard><Detail /></AvatarGuard></ProtectedRoute>} />
            <Route path="/watch" element={<RedirectOldWatch />} />
            <Route path="/detail" element={<RedirectOldDetail />} />
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
