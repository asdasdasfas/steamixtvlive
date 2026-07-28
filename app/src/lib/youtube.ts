export function getYoutubeId(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : /^[a-zA-Z0-9_-]{11}$/.test(url) ? url : null
}

const CACHE_KEY = 'kc_trailer_cache'

function getCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

function setCache(id: string | number, vid: string) {
  try { const c = getCache(); c[String(id)] = vid; localStorage.setItem(CACHE_KEY, JSON.stringify(c)) } catch {}
}

const memCache = new Map<string, string | null>()

export async function searchTrailer(tmdbId?: string | number | null, imdbId?: string | null): Promise<string | null> {
  const key = `tmdb:${tmdbId ?? ''}:imdb:${imdbId ?? ''}`
  if (memCache.has(key)) return memCache.get(key) ?? null
  const cached = getCache()[key]
  if (cached) { memCache.set(key, cached); return cached }
  try {
    const params = tmdbId ? `tmdb_id=${tmdbId}` : imdbId ? `imdb_id=${imdbId}` : ''
    if (!params) return null
    const res = await fetch(`https://api.kinocheck.com/movies?${params}&language=tr&categories=Trailer`)
    if (!res.ok) return null
    const data = await res.json()
    const vid = data?.trailer?.youtube_video_id || data?.videos?.[0]?.youtube_video_id || null
    if (vid) { setCache(key, vid); memCache.set(key, vid); return vid }
    return null
  } catch {
    return null
  }
}
