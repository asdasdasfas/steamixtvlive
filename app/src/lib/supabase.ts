const SUPABASE_URL = 'https://saiujcghtuchqyjzvhbh.supabase.co'
const ANON_KEY = 'sb_publishable_BJ5nRAqGdpoeQais3J7enA_4TqZKZIG'

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
}

async function supabaseGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers })
  if (!res.ok) return null
  const text = await res.text()
  if (!text || text === '[]') return null
  return JSON.parse(text)
}

async function supabasePatch(path: string, body: Record<string, any>): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
  return res.ok
}

export interface UserRow {
  id: number
  username: string
  password: string
  server_id: number
  avatar: number
  SÜRE: string
  sure_start_ms: number | null
  "canlı tv": string
  ban?: string
}

export interface ServerRow {
  id: number
  server_num: number
  base_url: string
  xtream_user: string
  xtream_pass: string
  owner: string | null
}

export async function findUser(username: string): Promise<UserRow | null> {
  const data = await supabaseGet<UserRow[]>(`/rest/v1/users?username=eq.${encodeURIComponent(username)}&limit=1`)
  return data && data.length > 0 ? data[0] : null
}

export async function getServer(serverNum: number): Promise<ServerRow | null> {
  const data = await supabaseGet<ServerRow[]>(`/rest/v1/servers?server_num=eq.${serverNum}&limit=1`)
  return data && data.length > 0 ? data[0] : null
}

export async function updateAvatar(username: string, avatarNum: number): Promise<boolean> {
  return supabasePatch(`/rest/v1/users?username=eq.${encodeURIComponent(username)}`, { avatar: avatarNum })
}

export async function updatePassword(username: string, newPass: string): Promise<boolean> {
  return supabasePatch(`/rest/v1/users?username=eq.${encodeURIComponent(username)}`, { password: newPass })
}

function encBase(base: string): string {
  return btoa(base).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function proxyUrl(base: string, path: string): string {
  return `/dyn/${encBase(base)}${path.startsWith('/') ? path : '/' + path}`
}

export interface XtreamLiveStream {
  num: number; name: string; stream_type: string; stream_id: number
  stream_icon: string; epg_channel_id: string; added: string; category_id: string
  category_ids: number[]; tv_archive: number; tv_archive_duration: number
}

export interface XtreamVod {
  num: number; name: string; stream_type: string; stream_id: number
  stream_icon: string; cover_big?: string; rating: string; rating_5based: number; added: string
  category_id: string; category_ids: number[]; container_extension: string
}

export interface XtreamSeries {
  num: number; name: string; stream_type: string; series_id: number
  stream_icon: string; cover?: string; cover_big?: string; movie_image?: string; thumbnail?: string
  rating: string; rating_5based: number; added: string
  category_id: string; category_ids: number[]
}

export interface XtreamCategory {
  category_id: string; category_name: string; parent_id: number
}

export interface XtreamVodInfo {
  info: { movie_data: { info: { movie_image: string; plot: string; cast: string; director: string; genre: string; releaseDate: string; rating: string; duration: string; youtube_trailer: string } } }
}

export interface XtreamSeriesInfo {
  info: { name: string; cover: string; plot: string; cast: string; director: string; genre: string; rating: string; releaseDate: string; youtube_trailer: string }
  episodes: Record<string, { id: string; episode_num: string; title: string; plot: string; stream_id: number; container_extension: string; season: string; info: { duration: string } }[]>
}

function xtUrl(base: string, user: string, pass: string) {
  return proxyUrl(base, `/player_api.php?username=${user}&password=${pass}`)
}

export async function fetchCategories(base: string, user: string, pass: string, type: 'live' | 'movie' | 'series') {
  const t = type === 'live' ? 'live' : type === 'movie' ? 'vod' : 'series'
  const res = await fetch(`${xtUrl(base, user, pass)}&action=get_${t}_categories`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json() as Promise<XtreamCategory[]>
}

export async function fetchLiveStreams(base: string, user: string, pass: string, catId?: string) {
  let u = `${xtUrl(base, user, pass)}&action=get_live_streams`
  if (catId) u += `&category_id=${catId}`
  const res = await fetch(u)
  if (!res.ok) throw new Error('Failed to fetch live')
  return res.json() as Promise<XtreamLiveStream[]>
}

function normalizeIcon(base: string, icon: string | undefined | null, _id?: number | string): string {
  if (icon && icon.startsWith('http://')) return proxyUrl(base, icon.replace(/^https?:\/\/[^\/]+/, ''))
  if (icon && icon.startsWith('https://')) return icon
  if (icon && icon.startsWith('/')) return proxyUrl(base, icon)
  if (icon) return icon
  return ''
}

function nonNull<T>(x: T | null): x is T { return x != null }

const ITEMS_PER_PAGE = 500
const MAX_PAGES = 50

async function paginatedFetch<T>(url: string, itemsPerPage = ITEMS_PER_PAGE): Promise<T[]> {
  const pagedUrl = `${url}&page=1&items_per_page=${itemsPerPage}`
  const res = await fetch(pagedUrl)
  if (!res.ok) throw new Error('Fetch failed')
  const text = await res.text()
  if (!text || text === '[]' || text === '{}') return []

  let first: any
  try { first = JSON.parse(text) } catch { return [] }

  // Case: object with "data" array (pagination metadata)
  if (first && typeof first === 'object' && !Array.isArray(first) && Array.isArray(first.data)) {
    const total = first.total || first.data.length
    const allItems: T[] = first.data.filter((i: any) => i != null)
    const totalPages = Math.ceil(total / itemsPerPage)
    if (totalPages <= 1) return allItems

    const pages: Promise<T[]>[] = []
    const pageCount = Math.min(totalPages - 1, MAX_PAGES - 1)
    for (let p = 2; p <= pageCount + 1; p++) {
      const pu = `${url}&page=${p}&items_per_page=${itemsPerPage}`
      pages.push(
        fetch(pu).then(r => r.ok ? r.text().then(t => {
          try { const d = JSON.parse(t); return (d.data || []).filter((i: any) => i != null) }
          catch { return [] as T[] }
        }) : [] as T[]).catch(() => [] as T[])
      )
    }
    const rest = await Promise.all(pages)
    return allItems.concat(...rest)
  }

  // Case: plain array
  if (Array.isArray(first)) {
    if (first.length < itemsPerPage) return first.filter((i: any) => i != null)
    const allItems: T[] = first.filter((i: any) => i != null)
    for (let p = 2; p <= MAX_PAGES; p++) {
      try {
        const r = await fetch(`${url}&page=${p}&items_per_page=${itemsPerPage}`)
        if (!r.ok) break
        const txt = await r.text()
        if (!txt) break
        const d = JSON.parse(txt)
        if (!Array.isArray(d) || d.length === 0) break
        allItems.push(...d.filter((i: any) => i != null))
        if (d.length < itemsPerPage) break
      } catch { break }
    }
    return allItems
  }

  return []
}

export async function fetchAllVods(base: string, user: string, pass: string) {
  const u = `${xtUrl(base, user, pass)}&action=get_vod_streams`
  return paginatedFetch<XtreamVod>(u)
}

export async function fetchAllSeries(base: string, user: string, pass: string) {
  const u = `${xtUrl(base, user, pass)}&action=get_series`
  return paginatedFetch<XtreamSeries>(u)
}

export async function fetchVods(base: string, user: string, pass: string, catId?: string) {
  let u = `${xtUrl(base, user, pass)}&action=get_vod_streams`
  if (catId) u += `&category_id=${catId}`
  const res = await fetch(u)
  if (!res.ok) throw new Error('Failed to fetch VODs')
  const data = await res.json() as XtreamVod[]
  return (data || [])
}

export async function fetchSeries(base: string, user: string, pass: string, catId?: string) {
  let u = `${xtUrl(base, user, pass)}&action=get_series`
  if (catId) u += `&category_id=${catId}`
  const res = await fetch(u)
  if (!res.ok) throw new Error('Failed to fetch series')
  const data = await res.json() as XtreamSeries[]
  return (data || [])
}

export async function fetchVodInfo(base: string, user: string, pass: string, vodId: number) {
  const res = await fetch(`${xtUrl(base, user, pass)}&action=get_vod_info&vod_id=${vodId}`)
  if (!res.ok) throw new Error('Failed to fetch VOD info')
  return res.json() as Promise<XtreamVodInfo>
}

export async function fetchSeriesInfo(base: string, user: string, pass: string, seriesId: number) {
  const res = await fetch(`${xtUrl(base, user, pass)}&action=get_series_info&series_id=${seriesId}`)
  if (!res.ok) throw new Error('Failed to fetch series info')
  return res.json() as Promise<XtreamSeriesInfo>
}

export function liveUrl(base: string, user: string, pass: string, id: number) {
  return proxyUrl(base, `/live/${user}/${pass}/${id}.m3u8`)
}

export type UrlTester = (base: string, user: string, pass: string, id: number) => string

export const vodUrlTesters: UrlTester[] = [
  // M3U8/MP4 first — better mobile codec support (MKV often has AC3/DTS audio unsupported on mobile)
  (b, u, p, i) => proxyUrl(b, `/movie/${u}/${p}/${i}.m3u8`),
  (b, u, p, i) => proxyUrl(b, `/movie/${u}/${p}/${i}.mp4`),
  (b, u, p, i) => proxyUrl(b, `/movie/${u}/${p}/${i}.mkv`),
  (b, u, p, i) => proxyUrl(b, `/movie/${u}/${p}/${i}`),
  (b, u, p, i) => proxyUrl(b, `/vod/${u}/${p}/${i}.m3u8`),
  (b, u, p, i) => proxyUrl(b, `/vod/${u}/${p}/${i}`),
  // Fallback with hardcoded servers for known backends
  (_b, u, p, i) => `/p2095/movie/${u}/${p}/${i}.m3u8`,
  (_b, u, p, i) => `/p2095/movie/${u}/${p}/${i}.mp4`,
  (_b, u, p, i) => `/p2095/movie/${u}/${p}/${i}.mkv`,
  (_b, u, p, i) => `/p8080/movie/${u}/${p}/${i}.m3u8`,
  (_b, u, p, i) => `/p8080/movie/${u}/${p}/${i}.mp4`,
  (_b, u, p, i) => `/p8080/movie/${u}/${p}/${i}.mkv`,
]

export function vodUrlWithExt(base: string, user: string, pass: string, id: number, ext: string) {
  const e = ext.startsWith('.') ? ext : `.${ext}`
  return proxyUrl(base, `/movie/${user}/${pass}/${id}${e}`)
}

export function seriesUrls(base: string, user: string, pass: string, id: number, season: string, ep: string, ext?: string, seriesId?: number): string[] {
  const urls: string[] = []
  const exts = [ext, 'mp4', 'mkv', 'm3u8', 'avi', 'ts', 'webm', 'mov'].filter(Boolean) as string[]
  const sid = seriesId || id
  const sNum = season.padStart(2, '0')
  const epNum = ep.padStart(2, '0')

  for (const x of exts) {
    urls.push(proxyUrl(base, `/series/${user}/${pass}/${id}.${x.replace(/^\./, '')}`))
  }
  urls.push(proxyUrl(base, `/series/${user}/${pass}/${id}`))

  for (const x of exts) {
    urls.push(proxyUrl(base, `/series/${user}/${pass}/${sid}/${sNum}/${ep}.${x.replace(/^\./, '')}`))
    urls.push(proxyUrl(base, `/series/${user}/${pass}/${sid}/${sNum}${epNum}.${x.replace(/^\./, '')}`))
  }
  urls.push(proxyUrl(base, `/series/${user}/${pass}/${sid}/${sNum}/${ep}`))
  urls.push(proxyUrl(base, `/series/${user}/${pass}/${sid}/${sNum}${epNum}`))

  for (const x of exts) {
    urls.push(proxyUrl(base, `/series/${user}/${pass}/${id}/${sNum}/${ep}.${x.replace(/^\./, '')}`))
  }
  urls.push(proxyUrl(base, `/series/${user}/${pass}/${id}/${sNum}/${ep}`))

  return urls
}

export function parseSureDuration(sure: string): number {
  if (!sure || sure === '0') return -1
  const lower = sure.toLowerCase()
  const num = parseFloat(lower)
  if (isNaN(num)) return -1
  if (lower.includes('yıl') || lower.includes('yil')) return num * 365 * 24 * 60 * 60 * 1000
  if (lower.includes('ay')) return num * 30 * 24 * 60 * 60 * 1000
  if (lower.includes('hafta')) return num * 7 * 24 * 60 * 60 * 1000
  if (lower.includes('gün') || lower.includes('gun') || lower.includes('day')) return num * 24 * 60 * 60 * 1000
  if (lower.includes('saat')) return num * 60 * 60 * 1000
  if (lower.includes('dakika')) return num * 60 * 1000
  if (lower.includes('saniye')) return num * 1000
  return num * 24 * 60 * 60 * 1000
}

export function posterUrl(base: string | undefined | null, icon: string | undefined | null, fallbackId?: number | string): string {
  if (icon && icon.startsWith('http://')) return proxyUrl(base || '', icon.replace(/^https?:\/\/[^\/]+/, ''))
  if (icon && icon.startsWith('https://')) return icon
  if (icon && icon.startsWith('/')) return proxyUrl(base || '', icon)
  if (icon) return icon
  if (base && fallbackId) return proxyUrl(base, `/images/${fallbackId}.jpg`)
  return ''
}
