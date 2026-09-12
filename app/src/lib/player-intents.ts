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

export const APK_DOWNLOAD_URL = 'https://www.dropbox.com/scl/fi/5zcdvv0trm5k6ihu82lbx/SteamixTV_v1.0.45_release.apk?rlkey=cs1cdukauc1xq4r6rus3mymig&st=i19br2a1&dl=1'
export const INSTALL_FLAG_KEY = 'steamix_player_ready'
