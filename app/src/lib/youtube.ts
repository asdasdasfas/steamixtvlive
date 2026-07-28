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

export async function searchTrailer(query: string, mediaType = 'movie'): Promise<string | null> {
  const key = `${mediaType}:${query.toLowerCase()}`
  if (memCache.has(key)) return memCache.get(key) ?? null
  const cached = getCache()[key]
  if (cached) { memCache.set(key, cached); return cached }
  try {
    const res = await fetch(`/api/trailer?name=${encodeURIComponent(query)}&type=${mediaType}`)
    if (res.ok) {
      const data = await res.json()
      if (data?.youtube_id) { setCache(key, data.youtube_id); memCache.set(key, data.youtube_id); return data.youtube_id }
    }
    memCache.set(key, null)
    return null
  } catch {
    memCache.set(key, null)
    return null
  }
}
