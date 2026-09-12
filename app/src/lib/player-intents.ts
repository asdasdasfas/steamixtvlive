export function buildSteamixIntentUrl(
  base_url: string,
  user: string,
  pass: string,
  streamId: number,
  ext: string,
  type?: 'movie' | 'series',
  subtitleUrl?: string,
  subtitleLang?: string
): string {
  const prefix = type === 'series' ? 'series' : 'movie'
  const path = `/${prefix}/${user}/${pass}/${streamId}.${ext || 'mkv'}`
  const directUrl = base_url.replace(/\/+$/, '') + path
  let intentUrl = `steamixtv://play?url=${encodeURIComponent(directUrl)}`
  if (subtitleUrl) {
    intentUrl += `&subtitle=${encodeURIComponent(subtitleUrl)}`
    if (subtitleLang) intentUrl += `&subtitle_lang=${encodeURIComponent(subtitleLang)}`
  }
  return intentUrl
}

export const APK_DOWNLOAD_URL = 'https://steamixtvlive-vgaq.onrender.com/SteamixTV.apk'
export const INSTALL_FLAG_KEY = 'steamix_player_ready'
