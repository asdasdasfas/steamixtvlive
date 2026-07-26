const APK_PACKAGE = 'com.steamixtv.player'

function buildDirectUrl(base_url: string, user: string, pass: string, streamId: number, ext: string): string {
  const path = `/movie/${user}/${pass}/${streamId}.${ext || 'mkv'}`
  return base_url.replace(/\/+$/, '') + path
}

// When APK may not be installed — simple scheme, no package → fallback works
export function buildSteamixIntentFallback(base_url: string, user: string, pass: string, streamId: number, ext: string): string {
  const directUrl = buildDirectUrl(base_url, user, pass, streamId, ext)
  return `steamixtv://play?url=${encodeURIComponent(directUrl)}`
}

// When APK is installed — intent:// + package → opens directly, no chooser
export function buildSteamixIntentDirect(base_url: string, user: string, pass: string, streamId: number, ext: string): string {
  const directUrl = buildDirectUrl(base_url, user, pass, streamId, ext)
  return `intent://play?url=${encodeURIComponent(directUrl)}#Intent;scheme=steamixtv;package=${APK_PACKAGE};end`
}

export const APK_DOWNLOAD_URL = 'https://www.dropbox.com/scl/fi/dycgacn48jyb55zcv7u7m/app-arm64-v8a-release.apk?rlkey=gqccyxlnezl5u2if30n4pzmhz&st=1x4v2kl2&dl=1'
export const INSTALL_FLAG_KEY = 'steamix_apk_installed'
