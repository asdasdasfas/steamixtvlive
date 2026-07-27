const YOUTUBE_API_KEY = 'AIzaSyDAivPXYp-wdmN2AmL7HUXvf4wHP2o9dHQ'
const CACHE_KEY = 'yt_trailer_cache'
const CACHE_TTL = 86400000 // 24 saat

function getCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

function setCache(query: string, id: string) {
  try {
    const c = getCache()
    c[query.toLowerCase()] = id
    localStorage.setItem(CACHE_KEY, JSON.stringify(c))
  } catch {}
}

function getKeywords(query: string): string[] {
  return query.toLowerCase().split(/[^a-z0-9çşğöüı]/i).filter(Boolean)
}

function matchesKeywords(title: string, keywords: string[]): number {
  return keywords.filter(k => title.includes(k)).length
}

const memCache = new Map<string, string | null>()

export async function searchTrailer(query: string): Promise<string | null> {
  const key = query.toLowerCase()
  if (memCache.has(key)) return memCache.get(key) ?? null
  const cached = getCache()[key]
  if (cached) { memCache.set(key, cached); return cached }
  try {
    const keywords = getKeywords(query)
    const isTurkish = /[şçğöüıİŞÇĞÖÜ]/.test(query)
    const trailerWords = isTurkish
      ? ['fragman', 'fragmanı', 'tanıtım', 'trailer', 'hd']
      : ['trailer', 'official trailer', 'hd trailer', 'teaser']
    for (const tw of trailerWords) {
      const q = encodeURIComponent(`"${query}" ${tw}`)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${YOUTUBE_API_KEY}&maxResults=5&type=video&regionCode=TR&relevanceLanguage=${isTurkish ? 'tr' : 'en'}`
      )
      if (!res.ok) continue
      const data = await res.json()
      for (const item of data?.items || []) {
        const title = (item?.snippet?.title || '').toLowerCase()
        if (trailerWords.some(w => title.includes(w)) && matchesKeywords(title, keywords) >= Math.ceil(keywords.length / 2)) {
          setCache(key, item.id.videoId); memCache.set(key, item.id.videoId)
          return item.id.videoId
        }
      }
    }
    for (const tw of trailerWords) {
      const q = encodeURIComponent(`${query} ${tw}`)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${YOUTUBE_API_KEY}&maxResults=5&type=video&regionCode=TR`
      )
      if (!res.ok) continue
      const data = await res.json()
      for (const item of data?.items || []) {
        const title = (item?.snippet?.title || '').toLowerCase()
        if (trailerWords.some(w => title.includes(w)) && matchesKeywords(title, keywords) >= Math.ceil(keywords.length / 2)) {
          setCache(key, item.id.videoId); memCache.set(key, item.id.videoId)
          return item.id.videoId
        }
      }
    }
    memCache.set(key, null)
    return null
  } catch {
    memCache.set(key, null)
    return null
  }
}
