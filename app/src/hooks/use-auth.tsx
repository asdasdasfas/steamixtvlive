import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { parseSureDuration, type UserRow, type ServerRow } from '@/lib/supabase'

interface AuthContextType {
  user: UserRow | null
  server: ServerRow | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
  saveAvatar: (num: number) => Promise<boolean>
  updatePassword: (oldPass: string, newPass: string) => Promise<boolean>
  needsAvatar: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null, server: null, loading: true, error: null,
  login: async () => null, logout: () => {}, saveAvatar: async () => false, updatePassword: async () => false, needsAvatar: false,
})

const SUPABASE_URL = 'https://saiujcghtuchqyjzvhbh.supabase.co'
const ANON_KEY = 'sb_publishable_BJ5nRAqGdpoeQais3J7enA_4TqZKZIG'

async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      signal,
    })
    if (!res.ok) return null
    const text = await res.text()
    if (!text || text === '[]') return null
    return JSON.parse(text)
  } catch { return null }
}

async function apiPatch(path: string, data: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      method: 'PATCH',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch { return false }
}

function isExpired(user: UserRow | null): boolean {
  const sure = user?.SÜRE || (user as any)?.süre || '0'
  if (!user || !sure || sure === '0') return false
  const durationMs = parseSureDuration(sure)
  if (durationMs <= 0) return false
  if (!user.sure_start_ms) return false
  const start = typeof user.sure_start_ms === 'string' ? parseInt(user.sure_start_ms) : user.sure_start_ms
  return (Date.now() - start) >= durationMs
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRow | null>(null)
  const [server, setServer] = useState<ServerRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(() => {
    setUser(null); setServer(null); localStorage.removeItem('session')
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('session')
      if (saved) {
        const { user: u, server: s } = JSON.parse(saved)
        if (isExpired(u)) {
          localStorage.removeItem('session')
        } else {
          setUser(u)
          setServer(s)
        }
      }
    } catch {}
    setLoading(false)
  }, [])

  // Periyodik abonelik kontrolü
  useEffect(() => {
    if (!user) return
    const id = setInterval(() => {
      if (isExpired(user)) {
        logout()
        window.location.href = '/login?expired=1'
      }
    }, 10000)
    return () => clearInterval(id)
  }, [user, logout])

  const needsAvatar = user !== null && (user.avatar === 0 || user.avatar === null || user.avatar === undefined)

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    setLoading(true); setError(null)

    // 10s timeout to prevent hanging
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      // Step 1: find user - önce aynı, bulamazsa ilike ile dene (ban eklenmiş olabilir)
      let users = await apiGet<any[]>(`/rest/v1/users?username=eq.${encodeURIComponent(username)}&limit=1`, controller.signal)
      if (!users || users.length === 0) {
        clearTimeout(timeout)
        users = await apiGet<any[]>(`/rest/v1/users?username=ilike.${encodeURIComponent(username + '%')}&limit=1`)
      }
      clearTimeout(timeout)
      if (!users || users.length === 0) {
        setLoading(false); const msg = 'Kullanıcı bulunamadı'; setError(msg); return msg
      }

      const row = users[0]

      // Ban kontrolü: username'de BAN/ban var mı veya ban sütunu dolu mu
      const usernameBan = (row.username || '').toLowerCase().includes('ban')
      const banCol = row.ban || (row as any).banli || (row as any).banned || ''
      if (usernameBan || banCol === '1' || banCol === 'true' || banCol === 'banlı' || banCol === 'ban') {
        setLoading(false); setError('Hesabınız kalıcı olarak engellenmiştir'); return 'Hesabınız kalıcı olarak engellenmiştir'
      }

      if (row.password !== password) {
        setLoading(false); const msg = 'Şifre hatalı'; setError(msg); return msg
      }

      // Step 1b: APK'daki gibi ayrı SÜRE sorgusu (row.username ile, login username değil)
      const sureData = await apiGet<any[]>(
        `/rest/v1/users?username=eq.${encodeURIComponent(row.username)}&select=SÜRE,sure_start_ms&limit=1`
      )
      const sureRaw = sureData?.[0]
      const sureVal = sureRaw?.SÜRE || (sureRaw as any)?.süre || row.SÜRE || row.süre || '0'
      const sureStartMs = sureRaw?.sure_start_ms ?? row.sure_start_ms ?? null

      // Step 2: get server (immediately sequential)
      const servers = await apiGet<any[]>(`/rest/v1/servers?server_num=eq.${row.server_id}&limit=1`)
      if (!servers || servers.length === 0) {
        setLoading(false); const msg = 'Sunucu bulunamadı'; setError(msg); return msg
      }
      const sv = servers[0]

      const banVal = row.ban || (row as any).banli || (row as any).banned || ''
      const found: UserRow = {
        id: row.id, username: (row.username || '').replace(/\s*ban\s*/gi, ''), password: row.password, server_id: row.server_id,
        avatar: row.avatar ?? 0, SÜRE: sureVal,
        sure_start_ms: sureStartMs,
        "canlı tv": row["canlı tv"] || 'açık',
        ban: banVal || undefined,
      }
      const srv: ServerRow = {
        id: sv.id, server_num: sv.server_num, base_url: sv.base_url,
        xtream_user: sv.xtream_user, xtream_pass: sv.xtream_pass, owner: sv.owner,
      }

      // Fire-and-forget sure_start_ms
      const durationMs = parseSureDuration(found.SÜRE || '0')
      if (durationMs > 0 && !found.sure_start_ms) {
        const now = Date.now()
        apiPatch(`/rest/v1/users?username=eq.${encodeURIComponent(row.username)}`, { sure_start_ms: now })
        found.sure_start_ms = now
      }

      // Abonelik süresi dolduysa girişe izin verme
      if (isExpired(found)) {
        setLoading(false); const msg = 'Abonelik süreniz dolmuştur'; setError(msg); return msg
      }

      setUser(found); setServer(srv)
      localStorage.setItem('session', JSON.stringify({ user: found, server: srv }))
      setLoading(false)
      return null
    } catch (e: any) {
      clearTimeout(timeout)
      const msg = e?.name === 'AbortError' ? 'Sunucu yanıt vermiyor' : (e?.message || 'Bir hata oluştu')
      setError(msg); setLoading(false)
      return msg
    }
  }, [])

  const saveAvatar = useCallback(async (num: number): Promise<boolean> => {
    if (!user) return false
    const ok = await apiPatch(`/rest/v1/users?username=eq.${encodeURIComponent(user.username)}`, { avatar: num })
    if (ok) {
      const updated = { ...user, avatar: num }
      setUser(updated)
      localStorage.setItem('session', JSON.stringify({ user: updated, server }))
    }
    return ok
  }, [user, server])

  const updatePassword = useCallback(async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!user) return false
    if (user.password !== oldPass) return false
    const ok = await apiPatch(`/rest/v1/users?username=eq.${encodeURIComponent(user.username)}`, { password: newPass })
    if (ok) {
      const updated = { ...user, password: newPass }
      setUser(updated)
      localStorage.setItem('session', JSON.stringify({ user: updated, server }))
    }
    return ok
  }, [user, server])

  return (
    <AuthContext.Provider value={{ user, server, loading, error, login, logout, saveAvatar, updatePassword, needsAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
