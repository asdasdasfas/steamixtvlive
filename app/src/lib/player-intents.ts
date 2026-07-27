export function buildSteamixIntentUrl(
  base_url: string,
  user: string,
  pass: string,
  streamId: number,
  ext: string,
  opts?: { type?: string; season?: string; episode?: string }
): string {
  let path: string
  if (opts?.type === 'series' && opts.season && opts.episode) {
    path = `/series/${user}/${pass}/${streamId}/${opts.season}/${opts.episode}${ext ? '.' + ext.replace(/^\./, '') : '.mkv'}`
  } else {
    path = `/movie/${user}/${pass}/${streamId}.${ext || 'mkv'}`
  }
  const directUrl = base_url.replace(/\/+$/, '') + path
  return `steamixtv://play?url=${encodeURIComponent(directUrl)}`
}

export const APK_DOWNLOAD_URL = 'https://www.dropbox.com/scl/fi/dycgacn48jyb55zcv7u7m/app-arm64-v8a-release.apk?rlkey=gqccyxlnezl5u2if30n4pzmhz&st=1x4v2kl2&dl=1'
export const INSTALL_FLAG_KEY = 'steamix_player_ready'
