const APK_PACKAGE = 'com.steamixtv.player'

export function buildSteamixIntentUrl(base_url: string, user: string, pass: string, streamId: number, ext: string): string {
  const path = `/movie/${user}/${pass}/${streamId}.${ext || 'mkv'}`
  const directUrl = base_url.replace(/\/+$/, '') + path
  // intent:// + action + category + package → manifest'teki intent-filter ile birebir eşleşir
  return `intent://play?url=${encodeURIComponent(directUrl)}#Intent;action=android.intent.action.VIEW;category=android.intent.category.DEFAULT;category=android.intent.category.BROWSABLE;scheme=steamixtv;package=${APK_PACKAGE};end`
}

export const APK_DOWNLOAD_URL = 'https://www.dropbox.com/scl/fi/dycgacn48jyb55zcv7u7m/app-arm64-v8a-release.apk?rlkey=gqccyxlnezl5u2if30n4pzmhz&st=1x4v2kl2&dl=1'
export const INSTALL_FLAG_KEY = 'steamix_player_ready'
