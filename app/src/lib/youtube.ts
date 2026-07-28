const YOUTUBE_API_KEY = 'AIzaSyDAivPXYp-wdmN2AmL7HUXvf4wHP2o9dHQ'
const CACHE_KEY = 'yt_trailer_cache'

function getCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

function setCache(query: string, id: string) {
  try { const c = getCache(); c[query.toLowerCase()] = id; localStorage.setItem(CACHE_KEY, JSON.stringify(c)) } catch {}
}

const memCache = new Map<string, string | null>()

export function getYoutubeId(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : /^[a-zA-Z0-9_-]{11}$/.test(url) ? url : null
}

export async function searchTrailer(query: string): Promise<string | null> {
  const key = query.toLowerCase()
  if (memCache.has(key)) return memCache.get(key) ?? null
  const cached = getCache()[key]
  if (cached) { memCache.set(key, cached); return cached }
  try {
    const q = encodeURIComponent(`${query} trailer`)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${YOUTUBE_API_KEY}&maxResults=3&type=video`
    )
    if (!res.ok) return null
    const data = await res.json()
    const vid = data?.items?.[0]?.id?.videoId || null
    if (vid) { setCache(key, vid); memCache.set(key, vid); return vid }
    memCache.set(key, null)
    return null
  } catch {
    memCache.set(key, null)
    return null
  }
}
