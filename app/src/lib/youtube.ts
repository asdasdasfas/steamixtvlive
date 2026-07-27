export const YOUTUBE_API_KEY = 'AIzaSyDAivPXYp-wdmN2AmL7HUXvf4wHP2o9dHQ'

export async function searchTrailer(query: string): Promise<string | null> {
  if (YOUTUBE_API_KEY === 'YOUR_KEY_HERE') return null
  try {
    const q = encodeURIComponent(`${query} HD trailer`)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.items?.[0]?.id?.videoId || null
  } catch {
    return null
  }
}
