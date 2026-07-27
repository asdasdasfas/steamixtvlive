const YOUTUBE_API_KEY = 'AIzaSyDAivPXYp-wdmN2AmL7HUXvf4wHP2o9dHQ'

const hasTurkishChars = (s: string) => /[şçğöüıİŞÇĞÖÜ]/g.test(s)

export async function searchTrailer(query: string): Promise<string | null> {
  try {
    const terms = hasTurkishChars(query)
      ? [`${query} fragman`, `${query} fragmanı`, `${query} trailer`]
      : [`${query} official trailer`, `${query} trailer`, `${query} HD trailer`]
    for (const term of terms) {
      const q = encodeURIComponent(term)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${YOUTUBE_API_KEY}&maxResults=3&type=video&regionCode=TR`
      )
      if (!res.ok) continue
      const data = await res.json()
      const items = data?.items || []
      for (const item of items) {
        const title = (item?.snippet?.title || '').toLowerCase()
        const isRelevant = hasTurkishChars(query)
          ? title.includes('fragman') || title.includes('trailer')
          : title.includes('trailer')
        if (isRelevant) return item.id.videoId
      }
    }
    return null
  } catch {
    return null
  }
}
