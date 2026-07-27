const YOUTUBE_API_KEY = 'AIzaSyDAivPXYp-wdmN2AmL7HUXvf4wHP2o9dHQ'

function getKeywords(query: string): string[] {
  return query.toLowerCase().split(/[^a-z0-9çşğöüı]/i).filter(Boolean)
}

function matchesKeywords(title: string, keywords: string[]): number {
  return keywords.filter(k => title.includes(k)).length
}

export async function searchTrailer(query: string): Promise<string | null> {
  try {
    const keywords = getKeywords(query)
    const isTurkish = /[şçğöüıİŞÇĞÖÜ]/.test(query)
    const trailerWords = isTurkish
      ? ['fragman', 'fragmanı', 'fragmanı', 'tanıtım', 'trailer', 'hd']
      : ['trailer', 'official trailer', 'hd trailer', 'teaser']

    // Try exact match first: "film adi" fragman
    for (const tw of trailerWords) {
      const q = encodeURIComponent(`"${query}" ${tw}`)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${YOUTUBE_API_KEY}&maxResults=5&type=video&regionCode=TR&relevanceLanguage=${isTurkish ? 'tr' : 'en'}`
      )
      if (!res.ok) continue
      const data = await res.json()
      for (const item of data?.items || []) {
        const title = (item?.snippet?.title || '').toLowerCase()
        const matchCount = matchesKeywords(title, keywords)
        // Title must contain at least one trailer word AND most of the keywords
        if (trailerWords.some(w => title.includes(w)) && matchCount >= Math.ceil(keywords.length / 2)) {
          return item.id.videoId
        }
      }
    }

    // Fallback: no quotes, broader match
    for (const tw of trailerWords) {
      const q = encodeURIComponent(`${query} ${tw}`)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${YOUTUBE_API_KEY}&maxResults=5&type=video&regionCode=TR`
      )
      if (!res.ok) continue
      const data = await res.json()
      for (const item of data?.items || []) {
        const title = (item?.snippet?.title || '').toLowerCase()
        const matchCount = matchesKeywords(title, keywords)
        if (trailerWords.some(w => title.includes(w)) && matchCount >= Math.ceil(keywords.length / 2)) {
          return item.id.videoId
        }
      }
    }

    return null
  } catch {
    return null
  }
}
